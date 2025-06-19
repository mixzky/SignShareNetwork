"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const bouncingDot = {
  initial: { y: 0 },
  animate: {
    y: [0, -6, 0], // bounce up and down
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatType: "loop" as "loop",
      ease: "easeInOut",
      delay: 0,
    },
  },
};

export default function CountrySearchBar() {
  const [searchWord, setSearchWord] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchWord.length >= 3) {
        fetchTags(searchWord);
      } else {
        setTags([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchWord]);

  const fetchTags = async (word: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/search-tags`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ search_word: word }),
        }
      );

      const data = await res.json();
      if (data.tags) setTags(data.tags);
    } catch (err) {
      console.error("Failed to fetch tags:", err);
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchWord(e.target.value);
    setTags([]);
  };

  return (
    <div className="w-full max-w-xl p-4 mb-8 relative">
      <form className="w-full" onSubmit={(e) => e.preventDefault()}>
        <div className="relative">
          <input
            type="text"
            placeholder="search a keyword"
            value={searchWord}
            onChange={onInputChange}
            className="w-full px-4 py-3 pr-10 rounded-full border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 text-base transition duration-200 ease-in-out"
            aria-autocomplete="list"
            aria-controls="tag-listbox"
            aria-expanded={tags.length > 0}
            aria-activedescendant=""
          />
          {searchWord && (
            <button
              type="button"
              onClick={() => {
                setSearchWord("");
                setTags([]);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xl"
              aria-label="Clear"
              tabIndex={-1}
            >
              ×
            </button>
          )}
        </div>
      </form>

      <AnimatePresence>
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute left-20 right-20 mt-1  bg-white rounded-full border border-gray-200 shadow-lg p-2 flex justify-center gap-1 z-10"
            aria-label="Loading suggestions"
          >
            {[0, 1, 2].map((idx) => (
              <motion.span
                key={idx}
                className="bg-blue-100 text-blue-800 text-sm font-medium px-2 mt-1 rounded-full inline-block"
                variants={bouncingDot}
                initial="initial"
                animate="animate"
                transition={{
                  ...bouncingDot.animate.transition,
                  delay: idx * 0.2,
                }}
              >
                .
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!loading && tags.length > 0 && (
          <motion.ul
            id="tag-listbox"
            role="listbox"
            key="tags"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute left-20 right-20 mt-1 flex justify-center gap-3 flex-wrap bg-white rounded-full border border-gray-200 shadow-lg p-2 z-10"
          >
            {tags.map((tag) => (
              <li
                key={tag}
                role="option"
                className="bg-blue-100 text-blue-800 text-sm font-medium px-4 py-1 rounded-full cursor-pointer transition hover:bg-blue-200"
              >
                {tag}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
