import { runStaticAudit } from './qa_audit';

if (import.meta.main) {
	const violations = runStaticAudit();
	const report = {
		timestamp: new Date().toISOString(),
		status: violations.length === 0 ? 'PASS' : 'FAIL',
		violationCount: violations.length,
		violations
	};
	console.log(JSON.stringify(report, null, '\t'));
	process.exit(violations.length === 0 ? 0 : 1);
}
