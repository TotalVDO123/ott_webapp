import React from 'react';
import { render } from '@testing-library/react';

import ListPlans from './ListPlans';

describe('<ListPlans>', () => {
  test('renders and matches snapshot', () => {
    const { container } = render(<ListPlans />);

    expect(container).toMatchSnapshot();
  });
});
