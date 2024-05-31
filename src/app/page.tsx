"use client";

import React, { useState, useEffect } from "react";

export default function Home() {
  const [action, setAction] = useState("Select an Action...");
  const [selectedCity, setSelectedCity] = useState("Select a Location...");
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch('/api/getCities');
        const data = await response.json();
        setCities(data.cities);
      } catch (error) {
        console.error("Error fetching cities:", error);
      }
    };

    fetchCities();
  }, []);

  const handleActionButtonClick = () => {
    setAction((prevAction) => (prevAction === "Rent" ? "Buy" : "Rent"));
  };

  const handleLocationButtonClick = () => {
    setDropdownVisible(!isDropdownVisible);
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setDropdownVisible(false);
  };

  const buttonStyle = "bg-transparent hover:bg-blue-900 text-white font-bold py-2 px-4 rounded w-48 h-12";

  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-8">
        <h1 className="text-5xl text-gray-700">hompare</h1>
      </header>
      <main className="flex flex-col items-start justify-start p-8 flex-grow">
        <div className="flex flex-col gap-4">
          <button
            onClick={handleActionButtonClick}
            className={`${buttonStyle} hover:bg-green-900`}
          >
            {action}
          </button>
          <div className="relative flex items-center w-48">
            <button
              onClick={handleLocationButtonClick}
              className={buttonStyle}
            >
              {selectedCity}
            </button>
            {isDropdownVisible && (
              <div className="absolute top-1/2 transform -translate-y-1/2 w-full bg-white border border-gray-300 rounded shadow-lg z-10 text-black max-h-60 overflow-y-auto">
                <ul className="py-1">
                  {cities.map((city) => (
                    <li
                      key={city}
                      className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
                      onClick={() => handleCitySelect(city)}
                    >
                      {city}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
