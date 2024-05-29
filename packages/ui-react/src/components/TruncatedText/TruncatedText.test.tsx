import React from 'react';
import { axe } from 'vitest-axe';
import { render } from '@testing-library/react';

import TruncatedText from './TruncatedText';

describe('<TruncatedText>', () => {
  test('renders and matches snapshot', () => {
    const { container } = render(<TruncatedText text="Test..." maximumLines={8} />);

    expect(container).toMatchSnapshot();
  });

  test('WCAG 2.2 (AA) compliant', async () => {
    const { container } = render(<TruncatedText text="Test..." maximumLines={8} />);

    expect(await axe(container, { runOnly: ['wcag21a', 'wcag21aa', 'wcag22aa'] })).toHaveNoViolations();
  });
});
