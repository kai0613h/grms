import React, { useEffect, useState } from 'react';
import Input from '../components/Input';
import Button from '../components/Button';
import { Laboratory } from '../types';
import { createLaboratory, deleteLaboratory, fetchLaboratories } from '../utils/api';
import { TrashIcon, ArrowPathIcon } from '../components/icons';

const LaboratoriesPage: React.FC = () => {
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [newLabName, setNewLabName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLaboratories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const labs = await fetchLaboratories();
      setLaboratories(labs);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '研究室一覧の取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLaboratories();
  }, []);

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = newLabName.trim();
    if (!name) return;
    setError(null);
    try {
      await createLaboratory(name);
      setNewLabName('');
      await loadLaboratories();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '研究室の追加に失敗しました。');
    }
  };

  const handleDelete = async (lab: Laboratory) => {
    if (!window.confirm(`${lab.name} を削除しますか？`)) return;
    setError(null);
    try {
      await deleteLaboratory(lab.id);
      await loadLaboratories();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '研究室の削除に失敗しました。');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">研究室管理</h1>
          <p className="mt-2 text-slate-500">研究室の追加・削除を行えます</p>
        </div>
        <Button variant="ghost" onClick={loadLaboratories} disabled={isLoading}>
          <ArrowPathIcon className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          再読み込み
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <form className="flex flex-col sm:flex-row gap-3 items-end" onSubmit={handleAdd}>
          <div className="flex-1 w-full">
            <Input
              label="新しい研究室名"
              placeholder="例: 佐藤研究室"
              value={newLabName}
              onChange={(e) => setNewLabName(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="primary" disabled={!newLabName.trim()}>
            追加
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">登録済み研究室 ({laboratories.length})</h2>
        </div>
        {laboratories.length === 0 ? (
          <div className="p-8 text-center text-slate-500">研究室が登録されていません。</div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {laboratories.map((lab) => (
              <li key={lab.id} className="flex items-center justify-between px-6 py-4">
                <div className="text-slate-800 font-medium">{lab.name}</div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(lab)}
                  title="削除"
                >
                  <TrashIcon className="h-4 w-4 mr-1.5" />
                  削除
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LaboratoriesPage;

