import { deterministicUuidV7Seed, type UiNode } from '@chronos-ui/svelte';

const uid = deterministicUuidV7Seed;

export const SHAPE_MATRIX_NODES: readonly UiNode[] = [
	{
		id: uid('matrix-pkg'), type: 'UiSection', zone: 'WORLD_CANVAS', label: 'Core UML Package', lifecycle: 'COMMITTED',
		shape: 'UML_PACKAGE', corners: ['CHAMFER', 'CHAMFER', 'CHAMFER', 'CHAMFER'], cornerEmbellishment: 'BRACKET', cornerAnimation: 'BREATHE',
		props: { title: 'UML_PACKAGE :: Core Runtime', subtitle: 'Nested component architecture enclosed inside tab hull', accent: 'primary' },
		children: [
			{ id: uid('matrix-comp'), type: 'UiSection', zone: 'WORLD_CANVAS', label: 'Renderer Component', lifecycle: 'COMMITTED', shape: 'UML_COMPONENT', cornerEmbellishment: 'TICKS', cornerAnimation: 'SCAN_GLINT', props: { title: 'UML_COMPONENT :: Vector Kernel', subtitle: 'Non-scaling hairline strokes + morph paths' }, children: [{ id: uid('matrix-leaf-gauge'), type: 'UiProgressGauge', zone: 'WORLD_CANVAS', label: 'Inscribed Safe Fill', lifecycle: 'COMMITTED', props: { label: 'Inscribed Safe Fill', value: 94, max: 100 } }] }
		]
	},
	{ id: uid('matrix-note'), type: 'UiSection', zone: 'WORLD_CANVAS', label: 'Architect Note', lifecycle: 'COMMITTED', shape: 'UML_NOTE', cornerEmbellishment: 'DOTS', cornerAnimation: 'DIAGONAL_DRIFT', props: { title: 'UML_NOTE :: Folded Contract', subtitle: 'Dog-ear corner fold + contour-locked normal drift' } },
	{ id: uid('matrix-db'), type: 'UiMetricCard', zone: 'WORLD_CANVAS', label: 'WAL Store Cylinder', lifecycle: 'COMMITTED', shape: 'UML_DATABASE', cornerEmbellishment: 'ARC', cornerAnimation: 'RETICLE_LOCK', props: { title: 'UML_DATABASE :: SQLite WAL', value: 'RFC 9562 v7', delta: 'SYNCED' } },
	{ id: uid('matrix-node3d'), type: 'UiMetricCard', zone: 'WORLD_CANVAS', label: 'Deployment Cube', lifecycle: 'COMMITTED', shape: 'UML_NODE_3D', cornerEmbellishment: 'CARET', cornerAnimation: 'SCAN_GLINT', props: { title: 'UML_NODE_3D :: Static Worker', value: 'vite build', delta: 'READY' }, children: [{ id: uid('matrix-node3d-sub'), type: 'UiBadge', zone: 'WORLD_CANVAS', label: 'Runtime Target Badge', lifecycle: 'COMMITTED', props: { text: 'BUN + VITE 8', tone: 'info' } }] },
	{ id: uid('matrix-hex'), type: 'UiMetricCard', zone: 'WORLD_CANVAS', label: 'Hexagon Core', lifecycle: 'COMMITTED', shape: 'HEXAGON', cornerEmbellishment: 'ARC', cornerAnimation: 'SCAN_GLINT', props: { title: 'HEXAGON :: Signal Router', value: '20 Hz DAG', delta: 'NOMINAL' } },
	{ id: uid('matrix-diamond'), type: 'UiMetricCard', zone: 'WORLD_CANVAS', label: 'Decision Diamond', lifecycle: 'COMMITTED', shape: 'DIAMOND', cornerEmbellishment: 'BRACKET', cornerAnimation: 'DIAGONAL_DRIFT', props: { title: 'DIAMOND :: Gate', value: 'PASS', delta: '0 CYCLES' } },
	{ id: uid('matrix-para'), type: 'UiMetricCard', zone: 'WORLD_CANVAS', label: 'Parallelogram Bus', lifecycle: 'COMMITTED', shape: 'PARALLELOGRAM', cornerEmbellishment: 'TICKS', cornerAnimation: 'SCAN_GLINT', props: { title: 'PARALLELOGRAM :: I/O Pipe', value: '17 Cursor', delta: 'STREAM' } },
	{ id: uid('matrix-trap'), type: 'UiMetricCard', zone: 'WORLD_CANVAS', label: 'Trapezoid Reducer', lifecycle: 'COMMITTED', shape: 'TRAPEZOID', cornerEmbellishment: 'ARC', cornerAnimation: 'DIAGONAL_DRIFT', props: { title: 'TRAPEZOID :: Mux', value: '3 Tiers', delta: 'CALM' } },
	{ id: uid('matrix-oct'), type: 'UiMetricCard', zone: 'WORLD_CANVAS', label: 'Octagon Shield', lifecycle: 'COMMITTED', shape: 'OCTAGON', cornerEmbellishment: 'CARET', cornerAnimation: 'RETICLE_LOCK', props: { title: 'OCTAGON :: RBAC Lock', value: 'u32 Mask', delta: 'SEALED' } },
	{ id: uid('matrix-doc'), type: 'UiSection', zone: 'WORLD_CANVAS', label: 'Document Artifact', lifecycle: 'COMMITTED', shape: 'DOCUMENT', cornerEmbellishment: 'TICKS', cornerAnimation: 'BREATHE', props: { title: 'DOCUMENT :: SSOT Ledger', subtitle: 'Wave-bottom archival manifest container' } },
	{ id: uid('matrix-sig'), type: 'UiSection', zone: 'WORLD_CANVAS', label: 'Signal Transmitter', lifecycle: 'COMMITTED', shape: 'SIGNAL_SEND', cornerEmbellishment: 'BRACKET', cornerAnimation: 'DIAGONAL_DRIFT', props: { title: 'SIGNAL_SEND :: Event Pulse', subtitle: 'Pentagon chevron emitter with outward diagonal drift' } },
	{ id: uid('matrix-cap'), type: 'UiActionBar', zone: 'WORLD_CANVAS', label: 'Corner Morph Bar', lifecycle: 'COMMITTED', shape: 'CAPSULE', corners: ['ROUND', 'ROUND', 'ROUND', 'ROUND'], cornerEmbellishment: 'DOTS', cornerAnimation: 'BREATHE', intentBinding: 'UI_SET_CORNER_STYLE', props: { actions: 'ROUND,CHAMFER,STRAIGHT' } },
	{ id: uid('matrix-box'), type: 'UiBadge', zone: 'TOP_LEFT', label: 'Matrix Mode Badge', lifecycle: 'COMMITTED', shape: 'BOX', corners: ['STRAIGHT', 'CHAMFER', 'STRAIGHT', 'CHAMFER'], cornerEmbellishment: 'CARET', cornerAnimation: 'BREATHE', props: { label: '14-Shape Matrix', tone: 'primary' } }
];
