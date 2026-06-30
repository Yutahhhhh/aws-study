import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Route, Server } from 'lucide-react';
import type { ChallengeConfig, ChallengeService } from '../types/challenge';
import type { DiagramConfig, DiagramPosition, DiagramStepState } from '../types/diagram';
import { defaultModeThemes } from '../theme/modeThemes';
import { useChallengeLoader } from '../hooks/useChallengeLoader';
import { runChallenge } from '../utils/challengeValidator';
import { Header } from '../components/common/Header';
import { FloatingPanel } from '../components/common/FloatingPanel';
import { ArchitectureDiagram } from '../components/diagram/ArchitectureDiagram';
import { AnswerTracePanel } from '../components/challenge/AnswerTracePanel';
import { ArchitectureBuilder, type ZoneRole } from '../components/challenge/ArchitectureBuilder';
import { ChallengeResultPanel } from '../components/challenge/ChallengeResultPanel';
import { RequirementsPanel } from '../components/challenge/RequirementsPanel';
import { ServicePalette } from '../components/challenge/ServicePalette';

const statusMeta: Record<ChallengeViewState, { label: string; chip: string }> = {
  editing: { label: '編集中', chip: 'border-slate-700 bg-slate-950 text-slate-300' },
  running: { label: '実行中', chip: 'border-slate-700 bg-slate-950 text-slate-300' },
  success: { label: '成功', chip: 'border-emerald-800 bg-emerald-950 text-emerald-200' },
  failure: { label: '失敗', chip: 'border-red-800 bg-red-950 text-red-200' },
  'answer-trace': { label: '模範解答', chip: 'border-amber-800 bg-amber-950 text-amber-200' },
};

const deriveZoneRoles = (challenge: ChallengeConfig): Record<string, ZoneRole> => {
  const roles: Record<string, ZoneRole> = {};
  const rules = challenge.awsRules;
  if (!rules) return roles;
  roles[rules.vpcZoneId] = 'vpc';
  for (const zoneId of [...rules.publicSubnetZoneIds, ...rules.privateSubnetZoneIds]) {
    roles[zoneId] = 'subnet';
  }
  return roles;
};

type ChallengeViewState = 'editing' | 'running' | 'success' | 'failure' | 'answer-trace';

const cloneDiagram = (diagram: DiagramConfig): DiagramConfig => ({
  viewport: { ...diagram.viewport },
  zones: diagram.zones.map((zone) => ({
    ...zone,
    position: { ...zone.position },
    contentPadding: zone.contentPadding ? { ...zone.contentPadding } : undefined,
    style: { ...zone.style },
  })),
  nodes: diagram.nodes.map((node) => ({
    ...node,
    position: { ...node.position },
    style: { ...node.style },
  })),
  connections: diagram.connections.map((connection) => ({
    ...connection,
    style: connection.style ? { ...connection.style } : undefined,
  })),
});

const filterTraceDiagram = (
  diagram: DiagramConfig,
  visibleNodeIds: string[],
  visibleConnectionIds: string[],
): DiagramConfig => {
  const visibleNodeIdSet = new Set(visibleNodeIds);

  return {
    ...diagram,
    nodes: diagram.nodes.filter((node) => visibleNodeIdSet.has(node.id)),
    connections: diagram.connections.filter(
      (connection) =>
        visibleConnectionIds.includes(connection.id) &&
        visibleNodeIdSet.has(connection.from) &&
        visibleNodeIdSet.has(connection.to),
    ),
  };
};

const getStagingNodePosition = (
  diagram: DiagramConfig,
  templatePosition: DiagramPosition,
): DiagramPosition => {
  const placedCount = Math.max(0, diagram.nodes.length + diagram.zones.length - 1);
  const column = placedCount % 4;
  const row = Math.floor(placedCount / 4);

  return {
    ...templatePosition,
    x: 24 + column * 170,
    y: 430 + row * 96,
  };
};

const getStagingZonePosition = (
  serviceId: string,
  templatePosition: DiagramPosition,
): DiagramPosition => {
  const stagingPositions: Record<string, Pick<DiagramPosition, 'x' | 'y'>> = {
    vpc: { x: 300, y: 100 },
    'public-subnet': { x: 20, y: 20 },
    'private-subnet': { x: 650, y: 20 },
  };
  const stagingPosition = stagingPositions[serviceId] ?? { x: 40, y: 40 };

  return {
    ...templatePosition,
    ...stagingPosition,
  };
};

const ChallengeWorkspace = ({ challenge }: { challenge: ChallengeConfig }) => {
  const [draftDiagram, setDraftDiagram] = useState(() => cloneDiagram(challenge.initialDiagram));
  const [viewState, setViewState] = useState<ChallengeViewState>('editing');
  const [result, setResult] = useState<ReturnType<typeof runChallenge> | null>(null);
  const [traceIndex, setTraceIndex] = useState(0);
  const zoneRoles = useMemo(() => deriveZoneRoles(challenge), [challenge]);

  const traceStep = challenge.answerTrace[traceIndex];
  const traceDiagram = useMemo(
    () =>
      filterTraceDiagram(
        challenge.answerDiagram,
        traceStep.visibleNodeIds,
        traceStep.visibleConnectionIds,
      ),
    [challenge.answerDiagram, traceStep],
  );

  const traceStepState: DiagramStepState = {
    activeNodeIds: traceStep.activeNodeIds,
    activeConnectionIds: traceStep.activeConnectionIds,
    packetAtNodeId: traceStep.activeNodeIds.at(-1) ?? '',
  };

  const existingNodeIds = draftDiagram.nodes.map((node) => node.id);
  const existingZoneIds = draftDiagram.zones.map((zone) => zone.id);
  const resultTone = viewState === 'failure' ? 'failure' : viewState === 'success' ? 'success' : 'idle';

  const changeDraft = (nextDiagram: DiagramConfig) => {
    setDraftDiagram(nextDiagram);
    if (viewState === 'success' || viewState === 'failure') {
      setResult(null);
      setViewState('editing');
    }
  };

  const addService = (service: ChallengeService) => {
    if (service.kind === 'zone') {
      if (draftDiagram.zones.some((zone) => zone.id === service.serviceId)) return;

      changeDraft({
        ...draftDiagram,
        zones: [
          ...draftDiagram.zones,
          {
            ...service.zone,
            // 追加直後はトップレベル（親未確定）。VPC枠へドロップして入れ子にする。
            parentZoneId: undefined,
            position: getStagingZonePosition(service.serviceId, service.zone.position),
            contentPadding: service.zone.contentPadding ? { ...service.zone.contentPadding } : undefined,
            style: { ...service.zone.style },
          },
        ],
      });
      return;
    }

    if (draftDiagram.nodes.some((node) => node.id === service.serviceId)) return;

    changeDraft({
      ...draftDiagram,
      nodes: [
        ...draftDiagram.nodes,
        {
          id: service.serviceId,
          ...service.node,
          position: getStagingNodePosition(draftDiagram, service.defaultPosition),
          style: { ...service.node.style },
        },
      ],
    });
  };

  const resetDraft = () => {
    setDraftDiagram(cloneDiagram(challenge.initialDiagram));
    setResult(null);
    setViewState('editing');
    setTraceIndex(0);
  };

  const runActions = () => {
    setViewState('running');
    const nextResult = runChallenge(challenge, draftDiagram);
    setResult(nextResult);
    setViewState(nextResult.status);
  };

  const showAnswerTrace = () => {
    setResult(null);
    setTraceIndex(0);
    setViewState('answer-trace');
  };

  const activeNodeIds = result?.activeNodeIds ?? [];
  const activeConnectionIds = result?.activeConnectionIds ?? [];

  const status = statusMeta[viewState];
  const isAnswerTrace = viewState === 'answer-trace';

  return (
    <div className="flex h-[100dvh] flex-col bg-slate-950 text-slate-100">
      <Header topicLabel={challenge.headerLabel} showGlossaryButton={false} />

      <div className="relative min-h-0 flex-1">
        {isAnswerTrace ? (
          <ArchitectureDiagram
            config={traceDiagram}
            stepState={traceStepState}
            activeTheme={defaultModeThemes.tertiary}
          />
        ) : (
          <ArchitectureBuilder
            diagram={draftDiagram}
            lockedNodeIds={challenge.lockedNodeIds}
            zoneRoles={zoneRoles}
            activeNodeIds={activeNodeIds}
            activeConnectionIds={activeConnectionIds}
            resultTone={resultTone}
            onChange={changeDraft}
          />
        )}

        {/* top-left: タイトル / 状態 */}
        <div className="absolute left-3 top-3 z-30 max-w-[min(78vw,20rem)]">
          <div className="rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-[10px] font-bold text-blue-300">{challenge.badge}</span>
              <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold ${status.chip}`}>
                {status.label}
              </span>
            </div>
            <h1 className="mt-0.5 truncate text-sm font-bold text-slate-100">{challenge.title}</h1>
          </div>
        </div>

        {isAnswerTrace ? (
          /* bottom-center: 模範解答トレース */
          <div className="absolute bottom-3 left-1/2 z-30 w-[min(92vw,26rem)] -translate-x-1/2">
            <AnswerTracePanel
              step={traceStep}
              currentIndex={traceIndex}
              totalSteps={challenge.answerTrace.length}
              onPrev={() => setTraceIndex((index) => Math.max(0, index - 1))}
              onNext={() =>
                setTraceIndex((index) => Math.min(challenge.answerTrace.length - 1, index + 1))
              }
              onExit={() => setViewState('editing')}
            />
          </div>
        ) : (
          <>
            {/* left: 要件（既定は折りたたみ） */}
            <div className="absolute left-3 top-[4.75rem] z-30">
              <FloatingPanel
                icon={<FileText size={15} />}
                label="要件"
                accentClass="text-blue-300"
                width="w-80"
                defaultCollapsed
              >
                <RequirementsPanel scenario={challenge.scenario} requirements={challenge.requirements} />
              </FloatingPanel>
            </div>

            {/* top-right: 構成要素 */}
            <div className="absolute right-3 top-3 z-30">
              <FloatingPanel
                icon={<Server size={15} />}
                label="構成要素"
                accentClass="text-blue-300"
                align="right"
                width="w-80"
              >
                <ServicePalette
                  services={challenge.services}
                  existingNodeIds={existingNodeIds}
                  existingZoneIds={existingZoneIds}
                  onAddService={addService}
                  onReset={resetDraft}
                />
              </FloatingPanel>
            </div>

            {/* bottom-center: 動作確認ドック */}
            <div className="absolute bottom-3 left-1/2 z-30 -translate-x-1/2">
              <FloatingPanel
                icon={<Route size={15} />}
                label="動作確認"
                accentClass="text-blue-300"
                width="w-[min(92vw,22rem)]"
              >
                <ChallengeResultPanel
                  state={viewState}
                  actions={challenge.actions}
                  result={result}
                  onRun={runActions}
                  onShowAnswerTrace={showAnswerTrace}
                />
              </FloatingPanel>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const ChallengePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { config, loading, error } = useChallengeLoader(slug!);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-sm text-slate-400">演習を読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <p className="mb-2 text-lg font-bold text-red-400">読み込みエラー</p>
          <p className="text-sm text-slate-400">{error?.message ?? '演習が見つかりませんでした'}</p>
        </div>
      </div>
    );
  }

  return <ChallengeWorkspace challenge={config} />;
};
