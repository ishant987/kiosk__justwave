import { Button } from './Button';

interface ModalProps {
  title: string;
  open: boolean;
  children: React.ReactNode;
  onClose: () => void;
}

export function Modal({ title, open, children, onClose }: ModalProps) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-header">
          <h2>{title}</h2>
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </header>
        {children}
      </section>
    </div>
  );
}
