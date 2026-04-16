import prisma from '../../lib/prisma.js';
import { STAGES } from '../workflow/transition-matrix.js';
import { transitionApplication } from '../workflow/stage-engine.js';

export class QuestionnaireServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'QuestionnaireServiceError';
    this.statusCode = statusCode;
  }
}

function toId(raw, label = 'id') {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new QuestionnaireServiceError(`Invalid ${label}.`, 400);
  return id;
}

function normalizeOptions(options) {
  const list = Array.isArray(options) ? options : [];
  return list.map((opt, idx) => ({
    label: String(opt?.label || `Option ${idx + 1}`),
    value: String(opt?.value || `${idx + 1}`),
    isCorrect: Boolean(opt?.isCorrect),
  }));
}

export async function createQuestionnaire(data, prismaClient = prisma) {
  const title = String(data?.title || '').trim();
  if (!title) throw new QuestionnaireServiceError('Title is required.', 400);
  const questions = Array.isArray(data?.questions) ? data.questions : [];
  if (!questions.length) throw new QuestionnaireServiceError('At least one question is required.', 400);

  return prismaClient.$transaction(async (tx) => {
    const questionnaire = await tx.questionnaire.create({
      data: {
        cityId: data?.cityId != null ? toId(data.cityId, 'cityId') : (data?.regionId != null ? toId(data.regionId, 'regionId') : null),
        title,
        description: String(data?.description || '').trim() || null,
        passingScore: Number(data?.passingScore) || 70,
        isActive: data?.isActive ?? true,
      },
    });
    await tx.questionnaireQuestion.createMany({
      data: questions.map((q, index) => ({
        questionnaireId: questionnaire.id,
        questionText: String(q?.questionText || '').trim(),
        questionType: String(q?.questionType || 'multiple_choice'),
        options: normalizeOptions(q?.options),
        points: Number(q?.points) || 1,
        sortOrder: q?.sortOrder != null ? Number(q.sortOrder) : index + 1,
      })),
    });
    return tx.questionnaire.findUnique({
      where: { id: questionnaire.id },
      include: { questions: { orderBy: { sortOrder: 'asc' } } },
    });
  });
}

export async function updateQuestionnaire(id, data, prismaClient = prisma) {
  const questionnaireId = toId(id, 'questionnaire id');
  const existing = await prismaClient.questionnaire.findUnique({ where: { id: questionnaireId } });
  if (!existing) throw new QuestionnaireServiceError('Questionnaire not found.', 404);

  return prismaClient.$transaction(async (tx) => {
    await tx.questionnaire.update({
      where: { id: questionnaireId },
      data: {
        title: data?.title != null ? String(data.title).trim() : undefined,
        description: data?.description != null ? String(data.description).trim() || null : undefined,
        cityId: data?.cityId !== undefined ? (data.cityId == null ? null : toId(data.cityId, 'cityId')) : (data?.regionId !== undefined ? (data.regionId == null ? null : toId(data.regionId, 'regionId')) : undefined),
        passingScore: data?.passingScore != null ? Number(data.passingScore) : undefined,
        isActive: data?.isActive != null ? Boolean(data.isActive) : undefined,
      },
    });
    if (Array.isArray(data?.questions)) {
      await tx.questionnaireQuestion.deleteMany({ where: { questionnaireId } });
      if (data.questions.length) {
        await tx.questionnaireQuestion.createMany({
          data: data.questions.map((q, index) => ({
            questionnaireId,
            questionText: String(q?.questionText || '').trim(),
            questionType: String(q?.questionType || 'multiple_choice'),
            options: normalizeOptions(q?.options),
            points: Number(q?.points) || 1,
            sortOrder: q?.sortOrder != null ? Number(q.sortOrder) : index + 1,
          })),
        });
      }
    }
    return tx.questionnaire.findUnique({
      where: { id: questionnaireId },
      include: { questions: { orderBy: { sortOrder: 'asc' } } },
    });
  });
}

export async function deleteQuestionnaire(id, prismaClient = prisma) {
  const questionnaireId = toId(id, 'questionnaire id');
  const refs = await prismaClient.questionnaireResponse.count({ where: { questionnaireId } });
  if (refs > 0) throw new QuestionnaireServiceError('Cannot delete questionnaire with responses.', 409);
  await prismaClient.questionnaire.delete({ where: { id: questionnaireId } });
  return { id: questionnaireId, deleted: true };
}

export async function getQuestionnaire(id, prismaClient = prisma) {
  const questionnaireId = toId(id, 'questionnaire id');
  const row = await prismaClient.questionnaire.findUnique({
    where: { id: questionnaireId },
    include: { questions: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!row) throw new QuestionnaireServiceError('Questionnaire not found.', 404);
  return row;
}

export async function getQuestionnaires(filters = {}, prismaClient = prisma) {
  const where = {};
  if (filters.cityId != null && filters.cityId !== '') where.cityId = toId(filters.cityId, 'cityId');
  else if (filters.regionId != null && filters.regionId !== '') where.cityId = toId(filters.regionId, 'regionId');
  if (filters.active != null && filters.active !== '') where.isActive = String(filters.active) === 'true';
  return prismaClient.questionnaire.findMany({
    where,
    include: { questions: { select: { id: true } } },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getQuestionnaireForApplication(applicationId, prismaClient = prisma) {
  const appId = toId(applicationId, 'application id');
  const app = await prismaClient.application.findUnique({
    where: { id: appId },
    include: { job: { include: { city: true } } },
  });
  if (!app) throw new QuestionnaireServiceError('Application not found.', 404);

  const questionnaire = await prismaClient.questionnaire.findFirst({
    where: {
      isActive: true,
      OR: [{ cityId: app.job?.cityId || null }, { cityId: null }],
    },
    include: { questions: { orderBy: { sortOrder: 'asc' } } },
    orderBy: [{ cityId: 'desc' }, { updatedAt: 'desc' }],
  });
  if (!questionnaire) throw new QuestionnaireServiceError('No active questionnaire available.', 404);

  const latestResponse = await prismaClient.questionnaireResponse.findFirst({
    where: { applicationId: appId, questionnaireId: questionnaire.id },
    orderBy: { submittedAt: 'desc' },
  });
  const safeQuestions = questionnaire.questions.map((q) => ({
    id: q.id,
    questionText: q.questionText,
    questionType: q.questionType,
    points: q.points,
    sortOrder: q.sortOrder,
    options: (Array.isArray(q.options) ? q.options : []).map((opt) => ({
      label: opt.label,
      value: opt.value,
    })),
  }));
  return {
    questionnaire: {
      id: questionnaire.id,
      title: questionnaire.title,
      description: questionnaire.description,
      passingScore: questionnaire.passingScore,
      questions: safeQuestions,
    },
    latestResponse,
  };
}

export async function submitQuestionnaireResponse(applicationId, questionnaireId, answers, prismaClient = prisma) {
  const appId = toId(applicationId, 'application id');
  const qId = toId(questionnaireId, 'questionnaire id');
  const app = await prismaClient.application.findUnique({ where: { id: appId } });
  if (!app) throw new QuestionnaireServiceError('Application not found.', 404);
  if (app.currentStage !== STAGES.QUESTIONNAIRE) {
    throw new QuestionnaireServiceError('Application must be in questionnaire stage.', 400);
  }
  const existing = await prismaClient.questionnaireResponse.findFirst({
    where: { applicationId: appId, questionnaireId: qId },
  });
  if (existing) throw new QuestionnaireServiceError('Questionnaire already submitted.', 409);

  const questionnaire = await prismaClient.questionnaire.findUnique({
    where: { id: qId },
    include: { questions: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!questionnaire) throw new QuestionnaireServiceError('Questionnaire not found.', 404);
  const answerMap = answers && typeof answers === 'object' ? answers : {};

  for (const q of questionnaire.questions) {
    if (answerMap[q.id] == null || String(answerMap[q.id]).trim() === '') {
      throw new QuestionnaireServiceError('All questions must be answered.', 400);
    }
  }

  let earnedPoints = 0;
  let totalPoints = 0;
  const breakdown = [];
  for (const q of questionnaire.questions) {
    const points = Number(q.points) || 1;
    totalPoints += points;
    const options = Array.isArray(q.options) ? q.options : [];
    const correct = options.find((opt) => opt?.isCorrect);
    const selected = String(answerMap[q.id]);
    const isCorrect = correct ? String(correct.value) === selected : false;
    if (isCorrect) earnedPoints += points;
    breakdown.push({
      questionId: q.id,
      questionText: q.questionText,
      selectedValue: selected,
      correctValue: correct?.value ?? null,
      isCorrect,
      points,
      earnedPoints: isCorrect ? points : 0,
    });
  }
  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = score >= (questionnaire.passingScore || 70);

  await prismaClient.$transaction(async (tx) => {
    await tx.questionnaireResponse.create({
      data: {
        applicationId: appId,
        questionnaireId: qId,
        answers: answerMap,
        score,
        passed,
      },
    });
    await tx.application.update({
      where: { id: appId },
      data: {
        moqScore: score,
        moqPassedAt: passed ? new Date() : null,
      },
    });
  });

  await transitionApplication(
    appId,
    STAGES.DECISION_PENDING,
    {
      actorEmail: app.email,
      actorType: 'driver',
      reason: 'questionnaire_submitted',
      metadata: { score, passed, earnedPoints, totalPoints },
    },
    prismaClient
  );

  return { score, passed, totalPoints, earnedPoints, breakdown };
}

export async function getQuestionnaireResult(applicationId, prismaClient = prisma) {
  const appId = toId(applicationId, 'application id');
  const response = await prismaClient.questionnaireResponse.findFirst({
    where: { applicationId: appId },
    include: {
      questionnaire: { include: { questions: { orderBy: { sortOrder: 'asc' } } },
      },
    },
    orderBy: { submittedAt: 'desc' },
  });
  if (!response) return null;
  const answers = response.answers && typeof response.answers === 'object' ? response.answers : {};
  const details = response.questionnaire.questions.map((q) => {
    const options = Array.isArray(q.options) ? q.options : [];
    const selectedValue = String(answers[q.id] ?? '');
    const selected = options.find((opt) => String(opt.value) === selectedValue);
    const correct = options.find((opt) => Boolean(opt.isCorrect));
    return {
      questionId: q.id,
      questionText: q.questionText,
      selectedValue: selectedValue || null,
      selectedLabel: selected?.label || null,
      correctValue: correct?.value || null,
      correctLabel: correct?.label || null,
      isCorrect: Boolean(correct && selectedValue && String(correct.value) === selectedValue),
    };
  });
  return {
    id: response.id,
    questionnaireId: response.questionnaireId,
    submittedAt: response.submittedAt,
    score: response.score,
    passed: response.passed,
    answers: details,
  };
}
