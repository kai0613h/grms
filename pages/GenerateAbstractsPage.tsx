
import React, { useEffect, useMemo, useRef, useState } from 'react';
import SectionTitle from '../components/SectionTitle';
import Button from '../components/Button';
import RadioCard from '../components/RadioCard';
import { MOCK_PROGRAMS } from '../constants';
import { SelectableProgram } from '../types';
import { getAbstractsByProgram } from '../data/mockAbstracts';
import { generateAbstractPdf, mergeAbstractPdfs } from '../utils/pdf';

interface GeneratedAbstractFile {
  id: string;
  order: number;
  presenter: string;
  title: string;
  url: string;
  fileName: string;
}

const GenerateAbstractsPage: React.FC = () => {
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(MOCK_PROGRAMS.length > 0 ? MOCK_PROGRAMS[0].id : null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [combinedFile, setCombinedFile] = useState<{ url: string; fileName: string } | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedAbstractFile[]>([]);
  const createdUrlsRef = useRef<string[]>([]);

  const cleanupObjectUrls = () => {
    createdUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    createdUrlsRef.current = [];
  };

  const handleSelectionChange = (programId: string) => {
    setSelectedProgramId(programId);
    setGenerationError(null);
    setCombinedFile(null);
    setGeneratedFiles([]);
    cleanupObjectUrls();
  };

  useEffect(() => {
    return () => {
      cleanupObjectUrls();
    };
  }, []);

  const selectedProgram = useMemo(
    () => (selectedProgramId ? MOCK_PROGRAMS.find((program) => program.id === selectedProgramId) ?? null : null),
    [selectedProgramId],
  );

  const programAbstracts = useMemo(
    () => (selectedProgramId ? getAbstractsByProgram(selectedProgramId) : []),
    [selectedProgramId],
  );

  const handleGenerate = () => {
    if (!selectedProgramId) {
      alert("プログラムを選択してください。");
      return;
    }

    if (programAbstracts.length === 0) {
      alert("選択したプログラムに紐づく抄録が見つかりませんでした。");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    cleanupObjectUrls();

    try {
      const generated = programAbstracts.map((submission) => {
        const pdfBytes = generateAbstractPdf(submission);
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        createdUrlsRef.current.push(url);

        const safePresenter = submission.presenter.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const fileName = `abstract-${submission.order.toString().padStart(2, '0')}-${safePresenter}.pdf`;

        return {
          id: submission.id,
          order: submission.order,
          presenter: submission.presenter,
          title: submission.title,
          url,
          fileName,
          pdfBytes,
        };
      });

      const mergedBytes = mergeAbstractPdfs(generated.map((item) => item.pdfBytes));
      const mergedBlob = new Blob([mergedBytes], { type: 'application/pdf' });
      const mergedUrl = URL.createObjectURL(mergedBlob);
      createdUrlsRef.current.push(mergedUrl);

      const programName = selectedProgram?.name?.replace(/\s+/g, '-') ?? 'program';
      const mergedFileName = `${programName}-abstract-booklet.pdf`;

      setGeneratedFiles(
        generated.map(({ pdfBytes, ...rest }) => ({
          ...rest,
        })),
      );
      setCombinedFile({ url: mergedUrl, fileName: mergedFileName });
    } catch (error) {
      console.error(error);
      setGenerationError("抄録集の生成中にエラーが発生しました。");
      setCombinedFile(null);
      setGeneratedFiles([]);
      cleanupObjectUrls();
    } finally {
      setIsGenerating(false);
    }
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

        {selectedProgram && (
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-md p-4">
            <p className="text-sm text-gray-600 mb-1">{selectedProgram.description}</p>
            <p className="text-sm text-gray-500">
              {selectedProgram.startTime} - {selectedProgram.endTime} / Room {selectedProgram.room}
            </p>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">提出済み抄録 (ダミーデータ)</h3>
          {programAbstracts.length > 0 ? (
            <ul className="space-y-2 text-sm text-gray-700">
              {programAbstracts.map((abstract) => (
                <li key={abstract.id} className="flex justify-between bg-gray-50 border border-gray-200 rounded px-3 py-2">
                  <span>
                    {abstract.order}. {abstract.title}
                  </span>
                  <span className="text-gray-500">Presenter: {abstract.presenter}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">このプログラムに紐づく抄録はまだありません。</p>
          )}
        </div>

        <div className="text-right">
          <Button onClick={handleGenerate} variant="primary" size="lg" disabled={!selectedProgramId || isGenerating}>
            {isGenerating ? '生成中...' : '作成'}
          </Button>
        </div>

        {generationError && <p className="mt-4 text-sm text-red-600">{generationError}</p>}

        {combinedFile && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md p-4">
              <div>
                <p className="font-semibold text-blue-900">抄録集のダウンロード準備が完了しました。</p>
                <p className="text-sm text-blue-700">発表順に結合されたPDFファイルを保存できます。</p>
              </div>
              <a href={combinedFile.url} download={combinedFile.fileName}>
                <Button variant="secondary">抄録集をダウンロード</Button>
              </a>
            </div>

            {generatedFiles.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-2 text-sm">結合対象の抄録PDF</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  {generatedFiles.map((file) => (
                    <li key={file.id} className="flex justify-between items-center bg-white border border-gray-200 rounded px-3 py-2">
                      <div>
                        <p className="font-medium">
                          {file.order}. {file.title}
                        </p>
                        <p className="text-gray-500">Presenter: {file.presenter}</p>
                      </div>
                      <a
                        href={file.url}
                        download={file.fileName}
                        className="text-blue-600 hover:underline"
                      >
                        個別PDF
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateAbstractsPage;
