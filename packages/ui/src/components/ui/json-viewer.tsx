import * as React from 'react';
import { Copy } from 'lucide-react';
import { Button } from './button';
import { cn } from './utils';

type ReactJsonComponentType = React.ComponentType<any>;

export interface JsonViewerProps {
  src?: unknown;
  value?: unknown;
  name?: string;
  collapsed?: boolean | number;
  className?: string;
  contentClassName?: string;
  enableClipboard?: boolean;
  editable?: boolean;
  editValue?: string;
  onEditValueChange?: (nextValue: string) => void;
  error?: string | null;
  title?: string;
}

export function JsonViewer({
  src,
  value,
  name = 'root',
  collapsed = 1,
  className,
  contentClassName,
  enableClipboard = true,
  editable = false,
  editValue,
  onEditValueChange,
  error,
  title,
}: JsonViewerProps) {
  const [ReactJsonComponent, setReactJsonComponent] =
    React.useState<ReactJsonComponentType | null>(null);
  const data = src ?? value ?? {};
  const copyValue = editable ? (editValue ?? '') : JSON.stringify(data, null, 2);

  React.useEffect(() => {
    let cancelled = false;

    void import('@microlink/react-json-view')
      .then((mod) => {
        if (!cancelled) {
          setReactJsonComponent(() => mod.default as ReactJsonComponentType);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReactJsonComponent(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const editableSrc = React.useMemo(() => {
    if (!editable) return data;
    if (!editValue) return data;
    try {
      return JSON.parse(editValue) as unknown;
    } catch {
      return data;
    }
  }, [data, editValue, editable]);

  const handleInlineUpdate = React.useCallback((event: any) => {
    const nextValue = event?.updated_src;
    if (nextValue === undefined) return false;
    onEditValueChange?.(JSON.stringify(nextValue, null, 2));
    return true;
  }, [onEditValueChange]);

  const handleCopy = async () => {
    if (!enableClipboard || typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(copyValue);
    } catch {
      // no-op for unsupported environments
    }
  };

  return (
    <div className={cn('rounded-lg border bg-card text-card-foreground flex flex-col', className)}>
      <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
        <p className="text-xs font-medium text-muted-foreground">{title ?? (editable ? 'JSON Editor' : 'JSON Viewer')}</p>
        {enableClipboard && (
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <div className={cn('overflow-auto flex-1 p-3 font-mono text-xs leading-5', contentClassName)}>
        <div className="min-w-max">
          {ReactJsonComponent ? (
            <ReactJsonComponent
              src={editable ? editableSrc : data}
              name={name}
              collapsed={collapsed as any}
              enableClipboard={false}
              displayDataTypes={false}
              displayObjectSize={false}
              quotesOnKeys={false}
              iconStyle="triangle"
              theme="rjv-default"
              style={{
                backgroundColor: 'transparent',
                fontSize: '12px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              }}
              onEdit={editable ? handleInlineUpdate : false}
              onAdd={editable ? handleInlineUpdate : false}
              onDelete={editable ? handleInlineUpdate : false}
            />
          ) : (
            <pre className="whitespace-pre text-[12px] leading-5">
              {copyValue}
            </pre>
          )}
          {error && <p className="mt-2 text-[11px] text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export const JsonViewerContext = {
  JsonViewer: `
  data: unknown (required)
  name?: string = "root"
  collapsed?: boolean | number = 1
  enableClipboard?: boolean = true
  editable?: boolean = false
  `.trim(),
}
