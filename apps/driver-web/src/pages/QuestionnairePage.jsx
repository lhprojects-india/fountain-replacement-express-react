import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, PageLayout, useToast } from "@lh/shared";
import { publicServices } from "../lib/public-services";
import { useAuth } from "../context/AuthContext";

const QuestionnairePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loadDriverApplication } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questionnaire, setQuestionnaire] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [questionnaireResult, resultResponse] = await Promise.all([
        publicServices.getDriverQuestionnaire(),
        publicServices.getDriverQuestionnaireResult().catch(() => ({ result: null })),
      ]);
      setQuestionnaire(questionnaireResult?.questionnaire || null);
      setResult(resultResponse?.result || questionnaireResult?.latestResponse || null);
      if (questionnaireResult?.latestResponse?.answers) {
        setAnswers(questionnaireResult.latestResponse.answers);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const allAnswered = useMemo(() => {
    const questions = questionnaire?.questions || [];
    if (!questions.length) return false;
    return questions.every((q) => answers[q.id] != null && String(answers[q.id]).trim() !== "");
  }, [questionnaire, answers]);

  const handleSubmit = async () => {
    if (!questionnaire || !allAnswered) return;
    setSubmitting(true);
    try {
      const submission = await publicServices.submitDriverQuestionnaire(questionnaire.id, answers);
      setResult(submission);
      await loadDriverApplication();
      toast({
        title: "Assessment submitted",
        description: "Your assessment has been recorded.",
      });
    } catch (error) {
      toast({
        title: "Submit failed",
        description: error?.response?.data?.message || "Unable to submit assessment.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <PageLayout title="Assessment">
      <div className="max-w-3xl mx-auto space-y-4">
        {loading ? (
          <p className="text-sm text-gray-600">Loading assessment...</p>
        ) : !questionnaire ? (
          <p className="text-sm text-gray-600">No questionnaire is currently assigned.</p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{questionnaire.title || "Assessment"}</CardTitle>
              <CardDescription>
                {questionnaire.description || "Answer the following questions based on your onboarding training."}
              </CardDescription>
              <p className="text-sm text-gray-700">Passing score: {questionnaire.passingScore}%</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {(questionnaire.questions || []).map((q, idx) => (
                <div key={q.id} className="rounded border p-3 space-y-2">
                  <p className="font-medium">Question {idx + 1} of {questionnaire.questions.length}</p>
                  <p>{q.questionText}</p>
                  <div className="space-y-2">
                    {(q.options || []).map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={opt.value}
                          checked={String(answers[q.id] || "") === String(opt.value)}
                          disabled={Boolean(result)}
                          onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.value }))}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div className="text-sm text-gray-600">
                Progress: {Object.keys(answers).filter((k) => String(answers[k]).trim()).length}/{questionnaire.questions.length}
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              {!result ? (
                <Button onClick={() => setConfirmOpen(true)} disabled={!allAnswered || submitting}>
                  Submit Assessment
                </Button>
              ) : (
                <div className="space-y-1">
                  <p className="font-medium">
                    You scored {result.earnedPoints ?? "?"} out of {result.totalPoints ?? "?"} ({result.score}%)
                  </p>
                  <p className={result.passed ? "text-green-700" : "text-amber-700"}>
                    {result.passed
                      ? "You passed! Your application is now under final review."
                      : "Your score did not meet the passing threshold. Your application is under review."}
                  </p>
                </div>
              )}
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Return to Dashboard
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit assessment?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">You can only submit once and cannot retake this assessment.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Confirm Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default QuestionnairePage;
