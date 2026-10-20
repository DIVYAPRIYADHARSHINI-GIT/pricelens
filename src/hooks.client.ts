import type { HandleClientError } from '@sveltejs/kit';

// 404s are an expected, handled state (friendly error page) - don't spam the console.
export const handleError: HandleClientError = ({ error, status }) => {
	if (status !== 404) console.error(error);
	return { message: status === 404 ? 'Not found' : 'Something went wrong. Please try again.' };
};
