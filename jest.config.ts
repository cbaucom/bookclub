import nextJest from 'next/jest';

const createJestConfig = nextJest({
	dir: './',
});

const customJestConfig = {
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
	testEnvironment: 'jest-environment-jsdom',
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/$1',
	},
	testPathIgnorePatterns: ['/node_modules/', '/.next/'],
	collectCoverageFrom: [
		'app/**/*.{js,jsx,ts,tsx}',
		'components/**/*.{js,jsx,ts,tsx}',
		'lib/**/*.{js,jsx,ts,tsx}',
		'hooks/**/*.{js,jsx,ts,tsx}',
		'!**/*.d.ts',
		'!**/node_modules/**',
	],
	// transformIgnorePatterns: [
	// 	'/node_modules/(?!(string-width|strip-ansi|eastasianwidth|emoji-regex|@clerk|is-fullwidth-code-point))',
	// ],
	// extensionsToTreatAsEsm: ['.ts', '.tsx', '.jsx'],
	// moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

export default createJestConfig(customJestConfig);
