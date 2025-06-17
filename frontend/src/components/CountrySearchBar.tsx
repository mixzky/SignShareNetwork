export default function CountrySearchBar() {
  return (
    <div className="w-full max-w-xl p-4 mb-8">
      <form className="w-full">
        <div className="relative">
          <input
            type="text"
            placeholder="search a keyword"
            className="w-full px-5 py-3 pr-10 rounded-full border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 text-base transition duration-200 ease-in-out"
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xl"
            aria-label="Clear"
            tabIndex={-1}
          >
            ×
          </button>
        </div>
      </form>
    </div>
  );
}
