"use client";

import React, { useState, useEffect, CSSProperties } from "react";

export default function Home() {
  const [action, setAction] = useState("Select an Action...");
  const [selectedCity, setSelectedCity] = useState("Select a Location...");
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isAreaDropdownVisible, setAreaDropdownVisible] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState("Select an Area...");

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
    setAreas([]);
    setSelectedArea("Select an Area...");
    setAreaDropdownVisible(false);
  };

  const handleAreaButtonClick = async () => {
    try {
      const response = await fetch(`/api/getAreas?city=${selectedCity}`);
      const data = await response.json();
      setAreas(data.areas);
      setAreaDropdownVisible(true);
    } catch (error) {
      console.error("Error fetching areas:", error);
    }
  };

  const handleAreaSelect = (area: string) => {
    setSelectedArea(area);
    setAreaDropdownVisible(false);
  };

  const handleSeePricesClick = async () => {
    const city = selectedCity;
    const area = (city === "Athens" || city === "Thessaloniki") ? selectedArea : city;

    try {
      const response = await fetch(`/api/getPrices?action=${action}&city=${city}&area=${area}`);
      const data = await response.json();
      console.log(data);
      // Handle the data as needed (e.g., display it in the UI)
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  };

  const buttonStyle = "bg-black hover:bg-green-950 text-white font-bold py-2 px-4 rounded w-48 h-12";

  const shouldShowSeePricesButton = () => {
    if (action === "Select an Action..." || selectedCity === "Select a Location...") {
      return false;
    }
    if ((selectedCity === "Athens" || selectedCity === "Thessaloniki") && selectedArea === "Select an Area...") {
      return false;
    }
    return true;
  };

  const headerStyle: CSSProperties = {
    backgroundColor: '#FFFFFF',
    padding: '1.8rem 4rem',
    height: 'auto'
  };

  const mainContainerStyle: CSSProperties = {
    backgroundColor: '#F0EFEB',
    minHeight: '100vh'
  };

  const h1Style: CSSProperties = {
    fontFamily: 'Arial, sans-serif',
  };

  return (
    <div style={mainContainerStyle}>
      <header style={headerStyle}>
      <h1 style={h1Style} className="text-5xl text-gray-700">hompare</h1>
      </header>
      <main className="flex flex-col items-start justify-start p-8 flex-grow">
        <div className="flex flex-col gap-4">
          <button
            onClick={handleActionButtonClick}
            className={`${buttonStyle} hover:bg-green-950`}
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
          {(selectedCity === "Athens" || selectedCity === "Thessaloniki") && (
            <div className="relative flex items-center w-48">
              <button
                onClick={handleAreaButtonClick}
                className={buttonStyle}
              >
                {selectedArea}
              </button>
              {isAreaDropdownVisible && (
                <div className="absolute top-1/2 transform -translate-y-1/2 w-full bg-white border border-gray-300 rounded shadow-lg z-10 text-black max-h-60 overflow-y-auto">
                  <ul className="py-1">
                    {areas.map((area) => (
                      <li
                        key={area}
                        className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
                        onClick={() => handleAreaSelect(area)}
                      >
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {shouldShowSeePricesButton() && (
            <button 
              onClick={handleSeePricesClick}
              className={`${buttonStyle} bg-orange-700 hover:bg-green-950`}
            >
              See Prices
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
