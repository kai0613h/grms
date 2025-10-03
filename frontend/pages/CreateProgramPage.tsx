
import React, { useState } from 'react';
import SectionTitle from '../components/SectionTitle';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import Button from '../components/Button';
import { Program } from '../types';
import { useNavigate } from 'react-router-dom';


const CreateProgramPage: React.FC = () => {
  const navigate = useNavigate();
  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [room, setRoom] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!programName || !programDescription || !startTime || !endTime || !room) {
        alert("すべての必須フィールドを入力してください。");
        return;
    }
    const newProgram: Omit<Program, 'id'> = {
      name: programName,
      description: programDescription,
      startTime,
      endTime,
      room,
    };
    // Placeholder for actual creation logic
    console.log("Creating program:", newProgram);
    alert(`プログラム「${programName}」を作成しました。`);
    // Reset form or navigate away
    setProgramName('');
    setProgramDescription('');
    setStartTime('');
    setEndTime('');
    setRoom('');
    // navigate('/some-success-page'); // Or back
  };

  const handleCancel = () => {
    // Reset form or navigate back
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="max-w-2xl mx-auto">
      <SectionTitle>プログラム作成</SectionTitle>
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-lg shadow-lg space-y-6">
        <Input
          label="Program name*"
          id="program-name"
          value={programName}
          onChange={(e) => setProgramName(e.target.value)}
          placeholder="プログラム名を入力"
          required
        />
        <Textarea
          label="Program description*"
          id="program-description"
          value={programDescription}
          onChange={(e) => setProgramDescription(e.target.value)}
          placeholder="説明を入力"
          required
          rows={6}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Start time*"
            id="start-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            placeholder="開始時刻"
            required
          />
          <Input
            label="End time*"
            id="end-time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            placeholder="終了時刻"
            required
          />
        </div>
        <Input
          label="Room*"
          id="room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="部屋を入力"
          required
        />
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={handleCancel}>
            キャンセル
          </Button>
          <Button type="submit" variant="primary">
            作成
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateProgramPage;
