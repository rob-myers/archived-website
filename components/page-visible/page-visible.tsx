import React from 'react';
const global = (typeof document === 'undefined') ? {} as Document : document;

/**
 * https://blog.sethcorker.com/harnessing-the-page-visibility-api-with-react/
 */
export default function usePageVisibility() {
  const [isVisible, setIsVisible] = React.useState(getIsDocumentHidden());
  const onVisibilityChange = () => setIsVisible(getIsDocumentHidden());

  React.useEffect(() => {
    const visibilityChange = getBrowserVisibilityProp();
    visibilityChange && window.addEventListener(visibilityChange, onVisibilityChange, false);

    return () => {
      visibilityChange && window.removeEventListener(visibilityChange, onVisibilityChange);
    };
  }, []);

  return !!isVisible;
}

function getBrowserVisibilityProp() {
  if (typeof global.hidden !== 'undefined') {
    // Opera 12.10 and Firefox 18 and later support
    return 'visibilitychange';
  } else if (typeof (global as any).msHidden !== 'undefined') {
    return 'msvisibilitychange';
  } else if (typeof (global as any).webkitHidden !== 'undefined') {
    return 'webkitvisibilitychange';
  }
}

function getBrowserDocumentHiddenProp() {
  if (typeof global.hidden !== 'undefined') {
    return 'hidden';
  } else if (typeof (global as any).msHidden !== 'undefined') {
    return 'msHidden';
  } else if (typeof (global as any).webkitHidden !== 'undefined') {
    return 'webkitHidden';
  }
}

function getIsDocumentHidden() {
  const prop = getBrowserDocumentHiddenProp();
  return prop && !(global as any)[prop];
}