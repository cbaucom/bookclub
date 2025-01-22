export const randomColor = () => {
	const colors = ['purple', 'red', 'orange', 'green', 'blue'];
	return colors[Math.floor(Math.random() * colors.length)];
};