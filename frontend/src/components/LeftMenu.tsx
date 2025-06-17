export default function LeftMenu() {
  return (
    <aside className="hidden md:block sticky top-28 h-[calc(98vh-7rem)] w-84 bg-white rounded-xl shadow-md">
      {/* Left menu content */}
      <div className="p-4 space-y-2">
        <div className="font-semibold">Menu</div>
        <button className="text-left w-full hover:bg-gray-100 p-2 rounded">
          Home
        </button>
        <button className="text-left w-full hover:bg-gray-100 p-2 rounded">
          Saved
        </button>
        <button className="text-left w-full hover:bg-gray-100 p-2 rounded">
          Trending
        </button>
      </div>
    </aside>
  );
}
