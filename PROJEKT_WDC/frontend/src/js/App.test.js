import { render, screen } from '@testing-library/react';
import App from './App';

/**
 * Test sprawdzający, czy na stronie pojawia się link 'learn react'.
 */
test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
