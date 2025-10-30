import { AbstractSubmission } from '../types';

export const MOCK_ABSTRACT_SUBMISSIONS: AbstractSubmission[] = [
  {
    id: 'abs-p1-01',
    programId: 'p1',
    order: 1,
    presenter: 'Haruka Mori',
    title: 'Edge AI Camera for Campus Safety',
    summary: 'Explores a compact AI camera that detects unusual motion on campus and raises instant alerts for staff.',
  },
  {
    id: 'abs-p1-02',
    programId: 'p1',
    order: 2,
    presenter: 'Daichi Inoue',
    title: 'Optimising Shared Lab Resources',
    summary: 'Presents a scheduling dashboard that balances student demand with device availability using a genetic algorithm.',
  },
  {
    id: 'abs-p1-03',
    programId: 'p1',
    order: 3,
    presenter: 'Miyu Takata',
    title: 'Acoustic Navigation Aid',
    summary: 'Introduces a wearable that offers haptic and voice guidance for visually impaired commuters in busy stations.',
  },
  {
    id: 'abs-p2-01',
    programId: 'p2',
    order: 1,
    presenter: 'Sota Kagawa',
    title: 'Lightweight Container Hardening',
    summary: 'Evaluates sandboxing strategies that reduce cold start overhead for serverless workloads in campus clusters.',
  },
  {
    id: 'abs-p2-02',
    programId: 'p2',
    order: 2,
    presenter: 'Emi Fujimoto',
    title: 'Realtime Flood Forecast Dashboard',
    summary: 'Describes a visual analytics portal combining rainfall sensors and community reports for rapid response teams.',
  },
  {
    id: 'abs-p2-03',
    programId: 'p2',
    order: 3,
    presenter: 'Yuto Arai',
    title: 'Energy Awareness in Student Housing',
    summary: 'Shares a gamified mobile app that nudges residents to reduce power consumption through peer challenges.',
  },
  {
    id: 'abs-p3-01',
    programId: 'p3',
    order: 1,
    presenter: 'Natsuki Honda',
    title: 'Interactive Storytelling Archive',
    summary: 'Builds an archive of alumni interviews with timeline playback to surface career insights for current students.',
  },
  {
    id: 'abs-p3-02',
    programId: 'p3',
    order: 2,
    presenter: 'Riku Yamane',
    title: 'Digital Greenhouse Twin',
    summary: 'Models a greenhouse with sensor feedback to recommend watering schedules and reduce manual intervention.',
  },
  {
    id: 'abs-p3-03',
    programId: 'p3',
    order: 3,
    presenter: 'Aya Nishida',
    title: 'VR Group Presentation Trainer',
    summary: 'Tests a VR rehearsal tool that offers live pacing and posture feedback for final presentation teams.',
  },
];

export const getAbstractsByProgram = (programId: string): AbstractSubmission[] =>
  MOCK_ABSTRACT_SUBMISSIONS.filter((submission) => submission.programId === programId).sort(
    (a, b) => a.order - b.order,
  );
