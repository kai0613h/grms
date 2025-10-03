
import React, { useState } from 'react';
import SectionTitle from '../components/SectionTitle';
import Button from '../components/Button';
import RadioCard from '../components/RadioCard';
import { MOCK_PROGRAMS } from '../constants';
import { SelectableProgram } from '../types';

const GenerateAbstractsPage: React.FC = () => {
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(MOCK_PROGRAMS.length > 0 ? MOCK_PROGRAMS[0].id : null);

  const handleSelectionChange = (programId: string) => {
    setSelectedProgramId(programId);
  };

  const handleGenerate = () => {
    if (!selectedProgramId) {
      alert("プログラムを選択してください。");
      return;
    }
    const selectedProgram = MOCK_PROGRAMS.find(p => p.id === selectedProgramId);
    // Placeholder for actual generation logic
    console.log("Generating abstracts for program:", selectedProgram);
    alert(`抄録集を生成中: ${selectedProgram?.name}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <SectionTitle>抄録集生成</SectionTitle>
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg">
        <p className="text-gray-600 mb-6">参照する発表プログラム選択</p>
        
        <div className="space-y-3 mb-8">
          {MOCK_PROGRAMS.map((program: SelectableProgram) => (
            <RadioCard
              key={program.id}
              id={`program-${program.id}`}
              name="selectedProgram"
              label={program.name}
              value={program.id}
              checked={selectedProgramId === program.id}
              onChange={handleSelectionChange}
            />
          ))}
        </div>

        <div className="text-right">
          <Button onClick={handleGenerate} variant="primary" size="lg" disabled={!selectedProgramId}>
            作成
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GenerateAbstractsPage;
