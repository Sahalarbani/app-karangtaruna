export default function Sheet({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        {title && (
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
