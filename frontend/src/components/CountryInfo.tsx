export default function CountryInfo({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute bg-black/20 backdrop-blur-md text-blue-200 p-4 rounded-lg shadow-lg"
      style={{
        top: "55%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "1200px",
        height: "720px",
      }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-blue-200 hover:text-white text-2xl font-bold"
        aria-label="Close"
        style={{ zIndex: 10 }}
      >
        ×
      </button>
      <h2 className="text-lg font-semibold text-center">Country Information</h2>
      <p className="text-sm text-center">
        Showing information for the selected country.
      </p>
    </div>
  );
}
