import { useRef } from 'react';

type Props = {
  source?: 'camera' | 'gallery';
  onFiles: (files: File[]) => void;
  children: (open: () => void) => React.ReactNode;
  multiple?: boolean;
};

/**
 * Hidden file input wired to either the native camera (iOS/Android)
 * or the photo library. Render-prop style so callers supply their own button.
 */
export function PhotoCapture({ source = 'gallery', onFiles, children, multiple = true }: Props) {
  const ref = useRef<HTMLInputElement | null>(null);

  function open() {
    ref.current?.click();
  }

  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple={multiple}
        {...(source === 'camera' ? { capture: 'environment' as const } : {})}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = '';
        }}
        style={{ display: 'none' }}
      />
      {children(open)}
    </>
  );
}
