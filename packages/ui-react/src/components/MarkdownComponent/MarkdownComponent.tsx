import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import classNames from 'classnames';

import styles from './MarkdownComponent.module.scss';

const renderer = new marked.Renderer();
renderer.link = (href: string, title: string, text: string) => {
  const externalLink = /^(https?|www\.|\/\/)/.test(href || '');
  const targetAttr = externalLink ? 'target="_blank"' : undefined;
  const relAttr = externalLink ? 'rel="noopener"' : undefined;
  const titleAttr = title ? `title="${title}"` : undefined;
  const attributes = [targetAttr, relAttr, titleAttr].filter(Boolean);

  return `<a href="${href}" ${attributes.join(' ')}>${text}</a>`;
};

// remove images and GitHub flavoured markdown when rendering inline
const inlineRenderer = new marked.Renderer({ gfm: false });
inlineRenderer.image = () => '';
inlineRenderer.link = renderer.link;

type Props = {
  markdownString: string;
  className?: string;
  inline?: boolean;
  tag?: string;
};

const MarkdownComponent: React.FC<Props> = ({ markdownString, className, tag = 'div', inline = false }) => {
  const sanitizedHTMLString = useMemo(() => {
    const dirtyHTMLString = inline ? marked.parseInline(markdownString, { renderer: inlineRenderer }) : marked.parse(markdownString, { renderer });

    return DOMPurify.sanitize(dirtyHTMLString, { ADD_ATTR: ['target'] });
  }, [inline, markdownString]);

  return React.createElement(tag, {
    dangerouslySetInnerHTML: { __html: sanitizedHTMLString },
    className: classNames(styles.markdown, inline && styles.inline, className),
  });
};

export default MarkdownComponent;
