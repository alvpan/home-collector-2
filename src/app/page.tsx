"use client";

import React, { useState, useEffect, CSSProperties } from "react";
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts'; 

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface CityData {
  surface: number;
  price: number;
  price_per_sq_m: number;
}

export default function Home() {
  const [action, setAction] = useState("Action");
  const [selectedCity, setSelectedCity] = useState("Location");
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isAreaDropdownVisible, setAreaDropdownVisible] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState("Area");
  const [activeHeaderButton, setActiveHeaderButton] = useState<string | null>('Latest Prices');
  const [isChartVisible, setChartVisible] = useState(false);
  const [chartData, setChartData] = useState<{
    options: ApexOptions,
    series: { name: string, data: number[] }[]
  }>({
    options: {
      chart: {
        type: 'area',
        background: 'transparent',
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        }
      },
      tooltip: {
        marker: {
          show: false,
        },
        theme: 'dark',
        style: {
          fontSize: '20px',
          fontFamily: undefined,
        }
      },
      markers: {
        size: 4,
        colors: ['orange'],
        strokeColors: 'orange',
        radius: 10,
        strokeWidth: 5
      },
      stroke: {
        curve: 'smooth'
      },
      dataLabels: {
        enabled: false
      },
      title: {
        text: 'Latest Average Price per Property Size',
        align: 'center',
        style: {
          fontSize: '16px',
          color: 'black',
          fontFamily: 'Consolas'
        }  
      },
      xaxis: {
        categories: [],
        labels: {
          rotate: -45,
          style: {
            colors: 'black',
            fontSize: '12px'
          }
        },
        title: {
          style: {
            fontSize: '16px',
            color: 'black',
            fontFamily: 'Consolas'
          }
        },
      },
      yaxis: {
        forceNiceScale: true,
        labels: {
          style: {
            colors: 'black',
            fontSize: '12px'
          }
        }
      },
      colors: ['orange'],
    },
    series: [
      {
        name: '€',
        data: [],
      }
    ]
  });

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
    setSelectedArea("Area");
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
      const data: CityData[] = await response.json();
      console.log(data);

      const surfaces = data.map((item: CityData) => item.surface);
      const prices = data.map((item: CityData) => item.price);

      setChartData(prevData => ({
        ...prevData,
        options: {
          ...prevData.options,
          xaxis: {
            ...prevData.options.xaxis,
            categories: surfaces,
          },
        },
        series: [
          {
            name: '€',
            data: prices,
          }
        ]
      }));

      setChartVisible(true); // Show the chart
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  };

  const handleHeaderButtonClick = (buttonName: string) => {
    setActiveHeaderButton(buttonName);
  };

  const buttonStyle = "bg-gray-700 hover:bg-black text-white py-2 px-4 rounded w-48 h-12";
  const headerButtonStyle = (buttonName: string) => ({
    background: 'transparent',
    color: 'black',
    padding: '0.5rem 1rem',
    fontSize: '1.125rem', // text-lg
    border: 'none',
    cursor: 'pointer',
    textDecoration: activeHeaderButton === buttonName ? 'underline' : 'none',
    textDecorationColor: activeHeaderButton === buttonName ? 'black' : 'transparent', // gray-700 hex code
    textDecorationThickness: activeHeaderButton === buttonName ? '2px' : '0px',
  });

  const shouldShowSeePricesButton = () => {
    if (action === "Action" || selectedCity === "Location") {
      return false;
    }
    if ((selectedCity === "Athens" || selectedCity === "Thessaloniki") && selectedArea === "Area") {
      return false;
    }
    return true;
  };

  const headerStyle: CSSProperties = {
    backgroundColor: '#FFFFFF',
    padding: '1.8rem 4rem',
    height: 'auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative'
  };

  const mainContainerStyle: CSSProperties = {
    backgroundColor: '#F0EFEB',
    minHeight: '100vh'
  };

  const h1Style: CSSProperties = {
    fontFamily: 'Arial, sans-serif',
  };

  const contentStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  };

  const buttonsContainerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  };

  const chartContainerStyle: CSSProperties = {
    flex: 1,
    marginLeft: '2rem',
  };

  const headerButtonsContainerStyle: CSSProperties = {
    display: 'flex',
    gap: '1rem',
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
  };

  return (
    <div style={mainContainerStyle}>
      <header style={headerStyle}>
        <h1 style={h1Style} className="text-5xl font-extrabold text-gray-700">hompare</h1>
        <div style={headerButtonsContainerStyle}>
          <button
            style={headerButtonStyle('Latest Prices')}
            onClick={() => handleHeaderButtonClick('Latest Prices')}
          >
            Latest Prices
          </button>
          <button
            style={headerButtonStyle('Compare Prices')}
            onClick={() => handleHeaderButtonClick('Compare Prices')}
          >
            Compare Prices
          </button>
          <button
            style={headerButtonStyle('Board no3')}
            onClick={() => handleHeaderButtonClick('Board no3')}
          >
            Board no3
          </button>
        </div>
      </header>
      <main className="flex flex-col items-start justify-start p-8 flex-grow">
        <div style={contentStyle}>
          <div style={buttonsContainerStyle}>
            <button
              onClick={handleActionButtonClick}
              className={buttonStyle}
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
                className={`${buttonStyle} bg-orange-700 hover:bg-orange-600`}
              >
                See Prices
              </button>
            )}
          </div>
          {isChartVisible && (
            <div style={chartContainerStyle}>
              <Chart
                options={chartData.options}
                series={chartData.series}
                type="area"
                height="400"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
