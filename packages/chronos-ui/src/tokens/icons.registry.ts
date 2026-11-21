export type UiIconName =
	| 'user'
	| 'wire'
	| 'sun'
	| 'moon'
	| 'help'
	| 'settings'
	| 'grip'
	| 'chevron-left'
	| 'chevron-right'
	| 'chevron-up'
	| 'chevron-down'
	| 'close'
	| 'plus'
	| 'trash'
	| 'star'
	| 'export'
	| 'radar'
	| 'layers'
	| 'palette'
	| 'spotlight'
	| 'book'
	| 'check'
	| 'warning'
	| 'lock'
	| 'copy'
	| 'play'
	| 'reset'
	| 'bot'
	| 'send'
	| 'undo'
	| 'redo'
	| 'folder'
	| 'code'
	| 'cpu'
	| 'plug'
	| 'mic'
	| 'mic-off'
	| 'gamepad'
	| 'dock'
	| 'keyboard'
	| 'wrench'
	| 'save'
	| 'cursor'
	| 'minus'
	| 'sliders'
	| 'grid'
	| 'eye'
	| 'expand'
	| 'minimize';

export const UI_ICON_PATHS: Record<UiIconName, string> = {
	user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0',
	wire: 'M4 7h4l3 10 3-14 2 4h4',
	sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-13v2m0 14v2m9-9h-2M5 12H3m15.4-6.4-1.4 1.4M7 17l-1.4 1.4m0-12.8L7 7m10 10 1.4 1.4',
	moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z',
	help: 'M9.5 9a2.5 2.5 0 1 1 3.7 2.2c-.8.4-1.2 1-1.2 1.8v1m0 3.5h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
	settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7-3 2-1.5-1.5-2.6-2.3.5a7 7 0 0 0-1.4-.8L15 5h-3l-.8 2.6a7 7 0 0 0-1.4.8l-2.3-.5L6 10.5 8 12l-2 1.5 1.5 2.6 2.3-.5c.4.3.9.6 1.4.8L12 19h3l.8-2.6c.5-.2 1-.5 1.4-.8l2.3.5 1.5-2.6L19 12Z',
	grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
	'chevron-left': 'M15 18l-6-6 6-6',
	'chevron-right': 'M9 6l6 6-6 6',
	'chevron-up': 'M6 15l6-6 6 6',
	'chevron-down': 'M6 9l6 6 6-6',
	close: 'M6 6l12 12M18 6L6 18',
	plus: 'M12 5v14M5 12h14',
	trash: 'M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13',
	star: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3Z',
	export: 'M12 15V4m0 0-4 4m4-4 4 4M4 16v3h16v-3',
	radar: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0-3 6-5',
	layers: 'M12 3l9 4.5-9 4.5-9-4.5L12 3Zm-9 9l9 4.5 9-4.5M3 16.5l9 4.5 9-4.5',
	palette: 'M12 3a9 9 0 0 0 0 18h1.5a2.5 2.5 0 0 0 0-5H12a2 2 0 0 1 0-4h5a4 4 0 0 0 4-4c0-2.8-4-5-9-5Z',
	spotlight: 'M12 2v3m0 14v3M4.9 4.9l2.1 2.1m10 10 2.1 2.1M2 12h3m14 0h3M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
	book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Zm0 0V20',
	check: 'M5 13l4 4L19 7',
	warning: 'M12 4L3 19h18L12 4Zm0 6v4m0 3h.01',
	lock: 'M7 11V8a5 5 0 0 1 10 0v3m-11 0h12v9H6v-9Z',
	copy: 'M9 9h10v11H9V9ZM5 15H4V4h11v1',
	play: 'M7 5l12 7-12 7V5Z',
	reset: 'M4 12a8 8 0 1 0 2.3-5.7L4 8.5M4 4v4.5h4.5',
	bot: 'M12 3v3M5 9h14v9H5V9Zm4 4h.01M15 13h.01M9 16h6',
	send: 'M4 12l16-7-5 14-3-5-8-2Z',
	undo: 'M9 14L4 9l5-5M4 9h10a5 5 0 1 1 0 10h-2',
	redo: 'M15 14l5-5-5-5M20 9H10a5 5 0 1 0 0 10h2',
	folder: 'M3 6h6l2 2h10v10H3V6Z',
	code: 'M8 9l-3 3 3 3M16 9l3 3-3 3M13 7l-2 10',
	cpu: 'M7 7h10v10H7V7Zm3-4v4m4-4v4m-4 10v4m4-4v4M3 10h4m-4 4h4m10-4h4m-4 4h4',
	plug: 'M9 3v5m6-5v5M7 8h10v4a5 5 0 0 1-10 0V8Zm5 9v4',
	mic: 'M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm-6 8a6 6 0 0 0 12 0m-6 6v4m-3 0h6',
	'mic-off': 'M9 9v2a3 3 0 0 0 5.1 2.1M15 9V6a3 3 0 0 0-5.4-1.8M6 11a6 6 0 0 0 9.6 4.8M12 17v4m-3 0h6M3 3l18 18',
	gamepad: 'M6 9h12l2 7-3 2-3-3H10l-3 3-3-2 2-7Zm2 3h2m-1-1v2m6-1h.01m2 1h.01',
	dock: 'M4 5h16v14H4V5Zm0 10h16m-7-7 1 1m-1-1-1 1',
	keyboard: 'M3 7h18v10H3V7Zm3 3h.01M9 10h.01M12 10h.01M15 10h.01M18 10h.01M7 14h10',
	wrench: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.2 2.2-2-2 2.2-2.2Z',
	save: 'M5 5h11l3 3v11H5V5Zm3 0v5h7V5m-6 9h6v5H9v-5Z',
	cursor: 'M5 4l13 7-5 2-2 5-6-14Z',
	minus: 'M5 12h14',
	sliders: 'M4 7h4m4 0h8M8 5v4M4 12h10m4 0h2M14 10v4M4 17h6m4 0h6M10 15v4',
	grid: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z',
	eye: 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
	expand: 'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7',
	minimize: 'M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7'
};
