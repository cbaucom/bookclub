export const randomColor = () => {
	const colors = ['purple', 'red', 'orange', 'green', 'blue'];
	return colors[Math.floor(Math.random() * colors.length)];
};

export const isValidEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};