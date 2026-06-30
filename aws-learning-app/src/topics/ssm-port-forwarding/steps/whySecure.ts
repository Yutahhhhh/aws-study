import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'no-ssh',
    title: 'SSHを開けない',
    description: '接続はEC2からSSMへのoutboundで成立するため、inbound 22を開ける必要がありません。SSH総当たり攻撃の面を消せます。',
    accentColor: 'text-emerald-400',
  },
  {
    glossaryTermId: 'rds-private',
    title: 'RDSは非公開のまま',
    description: 'RDSをインターネットに公開せずに管理接続できます。publicly_accessible は false のままで構いません。',
    accentColor: 'text-sky-400',
  },
];

export const whySecureSteps: SimulationStep[] = [
  {
    title: '【遮断】管理者PCからRDSへ直接接続を試みる',
    location: '従来のやり方との対比',
    diagramState: {
      activeNodeIds: ['admin-pc', 'rds'],
      activeConnectionIds: ['admin-to-rds'],
      packetAtNodeId: 'admin-pc',
      dimmedNodeIds: ['ssm', 'bastion'],
    },
    headers: { srcIp: '管理者PC', srcPort: '*', dstIp: 'RDS', dstPort: '5432' },
    labels: {
      srcIp: '(手元のPC)',
      srcPort: '(任意)',
      dstIp: '(Private RDSを直接)',
      dstPort: '(PostgreSQL)',
    },
    changes: [],
    desc: `<p>もしSSMを使わず、手元から直接RDSへ繋ごうとすると…</p>
           <p class='mt-2 text-rose-400 font-bold'>→ 届きません。RDSはPrivate Subnetにあり、<span onclick="openGlossary('rds-private')" class="glossary-link font-bold">外からの経路が無い</span >ためです。</p>
           <p class='mt-1 text-slate-400'>RDSをpublicにすれば届きますが、それは攻撃面を広げる悪手です。</p>`,
    keyPoints,
  },
  {
    title: '【従来の踏み台との違い】SSHを開けない',
    location: '管理用EC2 のSG',
    diagramState: {
      activeNodeIds: ['admin-pc', 'bastion'],
      activeConnectionIds: [],
      packetAtNodeId: 'bastion',
      dimmedNodeIds: ['ssm', 'rds'],
    },
    headers: { srcIp: '管理者PC', srcPort: '*', dstIp: '管理用EC2', dstPort: '22' },
    labels: {
      srcIp: '(手元のPC)',
      srcPort: '(任意)',
      dstIp: '(踏み台EC2へSSH?)',
      dstPort: '(SSH)',
    },
    changes: [],
    desc: `<p>従来のSSH踏み台では inbound 22 をどこかに開ける必要がありました。SSMでは不要です。</p>
           <p class='mt-2 text-emerald-400 font-bold'>→ 管理用EC2のSGは <span onclick="openGlossary('no-ssh')" class="glossary-link font-bold">inbound なし</span >。接続はEC2→SSMのoutboundで成立します。</p>
           <p class='mt-1 text-slate-400'>SSH鍵の配布・管理も不要になり、認可はIAMに一元化されます。</p>`,
    keyPoints,
  },
  {
    title: '【正しい経路】SSM経由でだけ到達できる',
    location: 'まとめ',
    diagramState: {
      activeNodeIds: ['admin-pc', 'ssm', 'bastion', 'rds'],
      activeConnectionIds: ['admin-to-ssm', 'ssm-to-bastion', 'bastion-to-rds'],
      packetAtNodeId: 'bastion',
      dimmedNodeIds: [],
    },
    headers: { srcIp: 'localhost', srcPort: '15432', dstIp: '(→ RDS)', dstPort: '5432' },
    labels: {
      srcIp: '(IAMで認可された管理者)',
      srcPort: '(ローカル)',
      dstIp: '(SSMトンネル経由)',
      dstPort: '(PostgreSQL)',
    },
    changes: [],
    desc: `<p>RDSへ到達できるのは、IAMで認可され、SSMトンネルを張れた管理者だけです。</p>
           <ul class='list-disc pl-4 space-y-1 mt-2 text-[11px]'>
             <li>RDSをpublicにしなくてよい</li>
             <li>SSH 22番を開けなくてよい / 鍵管理が不要</li>
             <li>IAMで接続権限を管理し、CloudTrail/SSMで監査できる</li>
           </ul>`,
    keyPoints,
  },
];
