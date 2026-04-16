import { useEffect, useMemo, useState } from "react";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@lh/shared";
import { adminServices } from "../../lib/admin-services";

function newQuestion(index = 1) {
  return {
    questionText: "",
    points: 1,
    sortOrder: index,
    options: [
      { label: "", value: "a", isCorrect: false },
      { label: "", value: "b", isCorrect: false },
      { label: "", value: "c", isCorrect: false },
      { label: "", value: "d", isCorrect: false },
    ],
  };
}

const QuestionnaireBuilder = () => {
  const [loading, setLoading] = useState(false);
  const [questionnaires, setQuestionnaires] = useState([]);
  const [cities, setCities] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    cityId: "",
    passingScore: 70,
    isActive: true,
    questions: [newQuestion(1)],
  });

  const load = async () => {
    setLoading(true);
    try {
      const [list, cityList] = await Promise.all([
        adminServices.getQuestionnaires(),
        adminServices.getAllCities(),
      ]);
      setQuestionnaires(list);
      setCities(cityList || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      title: "",
      description: "",
      cityId: "",
      passingScore: 70,
      isActive: true,
      questions: [newQuestion(1)],
    });
  };

  const canSave = useMemo(
    () => form.title.trim() && form.questions.length > 0 && form.questions.every((q) => q.questionText.trim()),
    [form]
  );

  return (
    <div className="adm-form-modern space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Questionnaires</h3>
        <Button variant="outline" className="adm-btn-outline" onClick={resetForm}>New</Button>
      </div>
      <div className="adm-table-shell">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Title</th>
              <th className="text-left p-2">City</th>
              <th className="text-left p-2">Questions</th>
              <th className="text-left p-2">Passing</th>
              <th className="text-left p-2">Active</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3 text-gray-500" colSpan={6}>Loading...</td></tr>
            ) : questionnaires.length === 0 ? (
              <tr><td className="p-3 text-gray-500" colSpan={6}>No questionnaires yet.</td></tr>
            ) : questionnaires.map((q) => (
              <tr key={q.id} className="border-t hover:bg-slate-50/70">
                <td className="p-2">{q.title}</td>
                <td className="p-2">{cities.find((c) => c.id === q.cityId)?.city || "All cities"}</td>
                <td className="p-2">{q.questions?.length || 0}</td>
                <td className="p-2">{q.passingScore}%</td>
                <td className="p-2">{q.isActive ? "Yes" : "No"}</td>
                <td className="p-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                      className="adm-btn-outline"
                    onClick={async () => {
                      const full = await adminServices.getQuestionnaire(q.id);
                      setEditingId(q.id);
                      setForm({
                        title: full.title || "",
                        description: full.description || "",
                        cityId: full.cityId ? String(full.cityId) : "",
                        passingScore: full.passingScore || 70,
                        isActive: Boolean(full.isActive),
                        questions: (full.questions || []).map((x, idx) => ({
                          questionText: x.questionText || "",
                          points: x.points || 1,
                          sortOrder: x.sortOrder || idx + 1,
                          options: Array.isArray(x.options) ? x.options : [],
                        })),
                      });
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                      className="adm-btn-outline"
                    onClick={async () => {
                      await adminServices.deleteQuestionnaire(q.id);
                      await load();
                    }}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="adm-panel p-4 space-y-3">
        <h4 className="font-semibold">{editingId ? "Edit Questionnaire" : "Create Questionnaire"}</h4>
        <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title" />
        <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Select value={form.cityId || "all"} onValueChange={(v) => setForm((p) => ({ ...p, cityId: v === "all" ? "" : v }))}>
            <SelectTrigger><SelectValue placeholder="City" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cities</SelectItem>
              {cities.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.city}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={form.passingScore}
            onChange={(e) => setForm((p) => ({ ...p, passingScore: Number(e.target.value) || 70 }))}
            placeholder="Passing score (%)"
          />
          <select
            className="h-10 rounded-md border px-3 text-sm bg-white"
            value={form.isActive ? "true" : "false"}
            onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.value === "true" }))}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <div className="space-y-3">
          {form.questions.map((q, idx) => (
            <div key={idx} className="adm-question-card space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Question {idx + 1}</div>
                <Button
                  size="sm"
                  variant="outline"
                  className="adm-btn-outline"
                  onClick={() => setForm((p) => ({ ...p, questions: p.questions.filter((_, i) => i !== idx) }))}
                >
                  Delete
                </Button>
              </div>
              <Input
                value={q.questionText}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((p) => ({
                    ...p,
                    questions: p.questions.map((row, i) => (i === idx ? { ...row, questionText: value } : row)),
                  }));
                }}
                placeholder="Question text"
              />
              <Input
                type="number"
                value={q.points}
                onChange={(e) => {
                  const value = Number(e.target.value) || 1;
                  setForm((p) => ({
                    ...p,
                    questions: p.questions.map((row, i) => (i === idx ? { ...row, points: value } : row)),
                  }));
                }}
                placeholder="Points"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(q.options || []).map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${idx}`}
                      checked={Boolean(opt.isCorrect)}
                      onChange={() => {
                        setForm((p) => ({
                          ...p,
                          questions: p.questions.map((row, i) => (
                            i === idx
                              ? {
                                ...row,
                                options: row.options.map((o, oi) => ({ ...o, isCorrect: oi === optIdx })),
                              }
                              : row
                          )),
                        }));
                      }}
                    />
                    <Input
                      value={opt.label}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((p) => ({
                          ...p,
                          questions: p.questions.map((row, i) => (
                            i === idx
                              ? {
                                ...row,
                                options: row.options.map((o, oi) => (oi === optIdx ? { ...o, label: value } : o)),
                              }
                              : row
                          )),
                        }));
                      }}
                      placeholder={`Option ${opt.value.toUpperCase()}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            className="adm-btn-outline"
            onClick={() => setForm((p) => ({ ...p, questions: [...p.questions, newQuestion(p.questions.length + 1)] }))}
          >
            + Add Question
          </Button>
        </div>

        <Button
          onClick={async () => {
            const payload = {
              title: form.title,
              description: form.description,
              cityId: form.cityId ? Number(form.cityId) : null,
              passingScore: Number(form.passingScore) || 70,
              isActive: Boolean(form.isActive),
              questions: form.questions.map((q, idx) => ({
                questionText: q.questionText,
                points: Number(q.points) || 1,
                sortOrder: idx + 1,
                options: (q.options || []).map((o) => ({
                  label: o.label,
                  value: o.value,
                  isCorrect: Boolean(o.isCorrect),
                })),
              })),
            };
            if (editingId) {
              await adminServices.updateQuestionnaire(editingId, payload);
            } else {
              await adminServices.createQuestionnaire(payload);
            }
            resetForm();
            await load();
          }}
          disabled={!canSave}
        >
          {editingId ? "Save Changes" : "Save Questionnaire"}
        </Button>
      </div>
    </div>
  );
};

export default QuestionnaireBuilder;
