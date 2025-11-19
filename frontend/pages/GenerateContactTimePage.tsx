
import React, { useState } from 'react';
import { ClockIcon, ArrowDownTrayIcon } from '../components/icons';
import Button from '../components/Button';
import RadioCard from '../components/RadioCard';
import Select from '../components/Select';

// Mock data for labs, people and years
const MOCK_LABS = [
  { id: 1, name: '小林研究室' },
  { id: 2, name: '佐藤研究室' },
  { id: 3, name: '鈴木研究室' },
  { id: 4, name: '高橋研究室' },
];

const MOCK_PEOPLE = [
  { id: 1, student_number: 5401, student_name: '浅島 楓良', laboratory_id: 1, theme: '品川区における最適避難所の分析', years_id: 2 },
  { id: 2, student_number: 5402, student_name: '高塚 空輝', laboratory_id: 2, theme: 'マイナンバーカードの暗号技術による安全性を体系的に学べるシステムの開発', years_id: 2 },
  { id: 3, student_number: 5403, student_name: '村上 祥', laboratory_id: 3, theme: '教職員の業務効率化と学生の主attiv行動を支援する進路支援システムの開発', years_id: 2 },
  { id: 4, student_number: 5404, student_name: '谷 春奈', laboratory_id: 4, theme: '聴覚障害者を対象にした投手の音声認識・文字起こしシステム', years_id: 2 },
  { id: 5, student_number: 5405, student_name: '大佐 悠惺', laboratory_id: 1, theme: 'Timing side-channel leak を排除したコードの生成技術の調査と開発について', years_id: 2 },
];

const MOCK_YEARS = [
  { id: 1, year: 2023 },
  { id: 2, year: 2024 },
];

const GenerateContactTimePage: React.FC = () => {
  const [selectedLabId, setSelectedLabId] = useState<number | null>(MOCK_LABS.length > 0 ? MOCK_LABS[0].id : null);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(MOCK_YEARS.length > 0 ? MOCK_YEARS[0].id : null);
  const [isGenerating, setIsGenerating] = useState(false);

  const peopleInLab = MOCK_PEOPLE.filter(p => p.laboratory_id === selectedLabId && p.years_id === selectedYearId);

  const handleLabSelectionChange = (labId: number) => {
    setSelectedLabId(labId);
    setSelectedPersonId(null);
  };

  const handleYearSelectionChange = (yearId: number) => {
    setSelectedYearId(yearId);
    setSelectedPersonId(null);
  };

  const fetchContactTimes = async () => {
    const MOCK_CONTACT_TIMES = [
      { date: '10/2', startTime: '10:00', endTime: '11:00', excluded: '0', duration: '60', content: 'React Nativeの環境構築' },
      { date: '10/3', startTime: '13:00', endTime: '14:30', excluded: '10', duration: '80', content: 'UIデザインの確認' },
    ];
    return new Promise(resolve => setTimeout(() => resolve(MOCK_CONTACT_TIMES), 500));
  };

  const generateLatexContent = (contactTimes: any[]) => {
    const selectedLab = MOCK_LABS.find(lab => lab.id === selectedLabId);
    const selectedPerson = MOCK_PEOPLE.find(person => person.id === selectedPersonId);

    if (!selectedLab || !selectedPerson) {
      return '';
    }

    const contactTimeLines = contactTimes.map(entry =>
      `\\addLine{${entry.date}}{${entry.startTime}}{${entry.endTime}}{${entry.excluded}}{${entry.duration}}{${entry.content}}`
    ).join('\n');

    const totalDuration = contactTimes.reduce((acc, entry) => acc + Number(entry.duration), 0);

    const latexString = `
\\documentclass[a4j,12pt]{jarticle}
%!TEX root = output.utf8.tex
\\usepackage[a4paper,totalheight=265mm,textwidth=175mm]{geometry}
\\pagestyle{empty}
\\setlength{\\unitlength}{1mm}
\\newcommand{\\ysize}{192}
\\newcommand{\\xline}{\\line(1,0){175}}%
\\newcommand{\\yline}{\\line(0,1){\\ysize}}%
\\newcount\\x
\\newcount\\y
\\newcommand{\\startFrame}{%
 \\begin{picture}(175,260)
  \\put(0,0){\\makebox(175,260){}}
  \\put(0,30){
   \\thicklines
   \\put(0,0){\\framebox(175,192){}}
   \\put(0,186){\\xline}
   \\put(66,0){\\line(0,-1){6}}%
   \\put(90,0){\\line(0,-1){6}}%
   \\put(66,-6){\\line(1,0){24}}%
   \\thinlines
   \\multiput(0,6)(0,6){30}{\\xline}
   \\put(16,0){\\yline}%
   \\put(33,0){\\yline}%
   \\put(50,0){\\yline}%
   \\put(66,0){\\yline}%
   \\put(90,0){\\yline}%
   \\put(0,186){
    \\put(0,0){\\makebox(16,6){日付}}%
    \\put(16,0){\\makebox(17,6){開始時刻}}%
    \\put(33,0){\\makebox(17,6){終了時刻}}%
    \\put(50,0){\\makebox(16,6){除外(分)}}%
    \\put(66,0){\\makebox(24,6){実施時間(分)}}%
    \\put(90,0){\\makebox(85,6){内容}}%
   }
  }
  \\put(0,0){
   \\thicklines
   \\put(0,0){\\framebox(90,18){}}
   \\thinlines
   \\multiput(0,6)(0,6){2}{\\line(1,0){90}}%
   \\put(45,0){\\line(0,1){18}}%
   \\put(0,0){\\makebox(45,6){総コンタクトタイム}}%
   \\put(0,6){\\makebox(45,6){これまでのコンタクトタイム}}%
   \\put(0,12){\\makebox(45,6){今回のコンタクトタイム}}%
  }
  \\put(155,0){\\thicklines\\framebox(20,20){}}
  \\put(140,0){教員の印}%

  \\global\\y=210
}

\\newcommand{\\nendoNumber}[3]{%
 \\put(0,236){\\makebox(175,8){\\Large\\bf #1年度　#2研究　コンタクトタイム記録用紙}}%
 \\put(0,244){\\makebox(175,6)[r]{No. #3}}%
}
\\newcommand{\\courseLaboName}[3]{
\\put(0,228){\\makebox(175,6){%
#1 \\hfil ${selectedLab.name} \\hfil #3
}}%
}
\\newcommand{\\lastFrame}{
 \\end{picture}
}

\\newcommand{\\addLine}[6]{
 \\put(0,\\y){%
  \\put(0,0){\\makebox(16,6){#1}}%
  \\put(16,0){\\makebox(17,6){#2}}%
  \\put(33,0){\\makebox(17,6){#3}}%
  \\put(50,0){\\makebox(16,6){#4}}%
  \\put(66,0){\\makebox(24,6){#5}}%
  \\put(91,0){\\makebox(83,6)[l]{#6}}%
 }
 \\global\\advance\\y by -6
}

\\newcommand{\\total}[1]{%
 \\put(66,24){\\makebox(24,6){#1}}
}

\\newcommand{\\writeTime}[3]{%
   \\put(45,0){\\makebox(45,6){#3}}%
   \\put(45,6){\\makebox(45,6){#2}}%
   \\put(45,12){\\makebox(45,6){#1}}%
}

\\begin{document}
\\startFrame
\\nendoNumber{2023}{卒業}{1}
\\courseLaboName{情報通信工学コース}{${selectedLab.name}}{${selectedPerson.student_name}}
${contactTimeLines}
\\total{${totalDuration}}
\\lastFrame
\\end{document}
`;
    return latexString;
  };

  const handleGenerate = async () => {
    if (!selectedLabId || !selectedPersonId) {
      alert("研究室と人を選択してください。");
      return;
    }

    setIsGenerating(true);
    const contactTimes = await fetchContactTimes() as any[];
    const latexContent = generateLatexContent(contactTimes);
    const blob = new Blob([latexContent], { type: 'application/x-latex' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contact-time.tex';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsGenerating(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">コンタクトタイム生成</h1>
        <p className="mt-2 text-slate-500">コンタクトタイム記録用紙（LaTeX）を生成します</p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8">
        <div>
          <Select
            label="年度を選択"
            options={MOCK_YEARS.map(y => ({ value: y.id, label: `${y.year}年度` }))}
            value={selectedYearId || ''}
            onChange={(e) => handleYearSelectionChange(Number(e.target.value))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">研究室を選択</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MOCK_LABS.map((lab) => (
              <RadioCard
                key={lab.id}
                id={`lab-${lab.id}`}
                name="selectedLab"
                label={lab.name}
                value={lab.id}
                checked={selectedLabId === lab.id}
                onChange={handleLabSelectionChange}
              />
            ))}
          </div>
        </div>

        {selectedLabId && selectedYearId && (
          <div className="animate-fade-in">
            <label className="block text-sm font-medium text-slate-700 mb-3">人を選択</label>
            <div className="space-y-3">
              {peopleInLab.length === 0 ? (
                <p className="text-sm text-slate-500 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  該当する学生がいません
                </p>
              ) : (
                peopleInLab.map((person) => (
                  <RadioCard
                    key={person.id}
                    id={`person-${person.id}`}
                    name="selectedPerson"
                    label={person.student_name}
                    description={`${person.student_number} / ${person.theme}`}
                    value={person.id}
                    checked={selectedPersonId === person.id}
                    onChange={setSelectedPersonId}
                  />
                ))
              )}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Button
            onClick={handleGenerate}
            variant="primary"
            size="lg"
            disabled={!selectedLabId || !selectedPersonId || isGenerating}
            className="w-full sm:w-auto shadow-lg shadow-indigo-500/20"
          >
            {isGenerating ? (
              <>
                <ClockIcon className="h-5 w-5 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                コンタクトタイム生成
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GenerateContactTimePage;
