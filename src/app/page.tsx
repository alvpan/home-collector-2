"use client";

import React, { useState, useEffect, CSSProperties } from "react";
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface CityData {
  surface: number;
  price: number;
  entry_date: string;
}

interface ChartData {
  options: ApexOptions,
  series: { name: string, data: number[] }[]
}

const LatestPrices: React.FC<{ chartData: ChartData }> = ({ chartData }) => (
  <Chart
    options={chartData.options}
    series={chartData.series}
    type="area"
    height="400"
  />
);

const HistoricalData: React.FC<{ chartData: ChartData, onSurfaceChange: (surface: number) => void, onTimeframeChange: (timeframe: string) => void, selectedSurface: number, selectedTimeframe: string, onRefresh: () => void }> = ({ chartData, onSurfaceChange, onTimeframeChange, selectedSurface, selectedTimeframe, onRefresh }) => {
  const [surfaceDropdownVisible, setSurfaceDropdownVisible] = useState(false);
  const [timeframeDropdownVisible, setTimeframeDropdownVisible] = useState(false);

  return (
    <div>
      <div className="flex space-x-4 mb-4">
        <div className="relative">
          <button className="bg-gray-700 hover:bg-black text-white py-2 px-4 rounded" onClick={() => setSurfaceDropdownVisible(prev => !prev)}>
            {selectedSurface ? selectedSurface + " sqm" : "Surface"}
          </button>
          {surfaceDropdownVisible && (
            <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded shadow-lg z-10 max-h-60 overflow-y-auto">
              <ul className="py-1 text-black">
                {Array.from({ length: 99 }, (_, i) => (i + 2) * 5).map((surface) => (
                  <li
                    key={surface}
                    className="px-4 py-2 hover:bg-gray-200 cursor-pointer text-black"
                    onClick={() => {
                      onSurfaceChange(surface);
                      setSurfaceDropdownVisible(false);
                    }}
                  >
                    {surface} sqm
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="relative">
          <button className="bg-gray-700 hover:bg-black text-white py-2 px-4 rounded" onClick={() => setTimeframeDropdownVisible(prev => !prev)}>
            {selectedTimeframe || "Timeframe"}
          </button>
          {timeframeDropdownVisible && (
            <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded shadow-lg z-10 max-h-60 overflow-y-auto">
              <ul className="py-1 text-black">
                {["last week", "last month", "last 6 months", "last year", "ever"].map((timeframe) => (
                  <li
                    key={timeframe}
                    className="px-4 py-2 hover:bg-gray-200 cursor-pointer text-black"
                    onClick={() => {
                      onTimeframeChange(timeframe);
                      setTimeframeDropdownVisible(false);
                    }}
                  >
                    {timeframe}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button className="bg-gray-700 hover:bg-black text-white py-2 px-4 rounded" onClick={onRefresh}>
          Refresh Chart
        </button>
      </div>
      <Chart
        options={chartData.options}
        series={chartData.series}
        type="area"
        height="400"
      />
    </div>
  );
};

const ComparePrices: React.FC = () => (
  <div>
    <input type="text" placeholder="Enter value" className="p-2 border border-gray-400 rounded" />
  </div>
);

export default function Home() {
  const [action, setAction] = useState("Action");
  const [selectedCity, setSelectedCity] = useState("Location");
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isAreaDropdownVisible, setAreaDropdownVisible] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState("Area");
  const [activeHeaderButton, setActiveHeaderButton] = useState<string>('Latest Prices');
  const [isChartVisible, setChartVisible] = useState(false);
  const [latestPricesChartLoaded, setLatestPricesChartLoaded] = useState(false);
  const [historicalDataChartLoaded, setHistoricalDataChartLoaded] = useState(false);
  
  const [latestPricesChartData, setLatestPricesChartData] = useState<ChartData>({
    options: {
      chart: {
        type: 'area',
        background: 'transparent',
        toolbar: { show: false },
        zoom: { enabled: false }
      },
      tooltip: {
        marker: { show: false },
        theme: 'dark',
        style: { fontSize: '20px', fontFamily: undefined }
      },
      markers: { size: 4, colors: ['orange'], strokeColors: 'orange', radius: 10, strokeWidth: 5 },
      stroke: { curve: 'smooth' },
      dataLabels: { enabled: false },
      xaxis: {
        categories: [],
        labels: { rotate: -45, style: { colors: 'black', fontSize: '12px' } },
        title: { text: 'Surface (m²)', style: { fontSize: '16px', color: 'black', fontFamily: 'Consolas' } }
      },
      yaxis: {
        forceNiceScale: true,
        labels: { style: { colors: 'black', fontSize: '12px' } },
        title: { text: 'Price (€)', style: { fontSize: '16px', color: 'black', fontFamily: 'Consolas' } },
        min: undefined,
        max: undefined
      },
      colors: ['orange'],
    },
    series: [{ name: '€', data: [] }]
  });

  const [historicalDataChartData, setHistoricalDataChartData] = useState<ChartData>({
    options: {
      chart: {
        type: 'area',
        background: 'transparent',
        toolbar: { show: false },
        zoom: { enabled: false }
      },
      tooltip: {
        marker: { show: false },
        theme: 'dark',
        style: { fontSize: '20px', fontFamily: undefined }
      },
      markers: { size: 4, colors: ['orange'], strokeColors: 'orange', radius: 10, strokeWidth: 5 },
      stroke: { curve: 'smooth' },
      dataLabels: { enabled: true, formatter: (val) => `€${val}` },
      xaxis: {
        categories: [],
        labels: { rotate: -45, style: { colors: 'black', fontSize: '12px' } }
      },
      yaxis: {
        forceNiceScale: true,
        labels: { style: { colors: 'black', fontSize: '12px' } },
        title: { text: 'Price (€)', style: { fontSize: '16px', color: 'black', fontFamily: 'Consolas' } },
        min: undefined,
        max: undefined
      },
      colors: ['orange'],
    },
    series: [{ name: '€', data: [] }]
  });

  const [selectedSurface, setSelectedSurface] = useState<number>(50);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("last month");
  const [previousSurface, setPreviousSurface] = useState<number>(50);
  const [previousTimeframe, setPreviousTimeframe] = useState<string>("last month");
  const [surfaceDropdownVisible, setSurfaceDropdownVisible] = useState(false);
  const [timeframeDropdownVisible, setTimeframeDropdownVisible] = useState(false);

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

  useEffect(() => {
    if (action !== "Action" && selectedCity !== "Location" && (selectedCity !== "Athens" && selectedCity !== "Thessaloniki" || selectedArea !== "Area")) {
      setChartVisible(false);
      setLatestPricesChartLoaded(false);
      setHistoricalDataChartLoaded(false);
    }
  }, [action, selectedCity, selectedArea]);

  const clearLatestPricesChartData = () => {
    setLatestPricesChartData(prevData => ({
      ...prevData,
      series: [{ name: '€', data: [] }],
      options: { ...prevData.options, xaxis: { ...prevData.options.xaxis, categories: [] } }
    }));
  };

  const clearHistoricalChartData = () => {
    setHistoricalDataChartData(prevData => ({
      ...prevData,
      series: [{ name: '€', data: [] }],
      options: { ...prevData.options, xaxis: { ...prevData.options.xaxis, categories: [] } }
    }));
  };

  const addYAxisPadding = (data: number[]) => {
    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const padding = (maxValue - minValue) * 0.3;

    return {
      min: Math.max(0, minValue - padding),
      max: maxValue + padding,
    };
  };

  const fetchHistoricalData = async (surface: number, timeframe: string) => {
    const city = selectedCity;
    const area = (city === "Athens" || city === "Thessaloniki") ? selectedArea : city;

    try {
      const response = await fetch(`/api/getHistoricalData?action=${action}&city=${city}&area=${area}&surface=${surface}&timeframe=${timeframe}`);
      const data: CityData[] = await response.json();
      console.log(data);

      const dates = data.map((item: CityData) => item.entry_date);
      const prices = data.map((item: CityData) => item.price);
      const { min, max } = addYAxisPadding(prices);

      setHistoricalDataChartData(prevData => ({
        ...prevData,
        options: {
          ...prevData.options,
          xaxis: { ...prevData.options.xaxis, categories: dates },
          yaxis: { 
            ...prevData.options.yaxis, 
            min: min,
            max: max,
          },
        },
        series: [{ name: '€', data: prices }]
      }));

      setChartVisible(true);
      setHistoricalDataChartLoaded(true);
    } catch (error) {
      console.error("Error fetching historical data:", error);
    }
  };

  const fetchLatestPricesData = async () => {
    const city = selectedCity;
    const area = (city === "Athens" || city === "Thessaloniki") ? selectedArea : city;

    try {
      const response = await fetch(`/api/getPrices?action=${action}&city=${city}&area=${area}`);
      const data: CityData[] = await response.json();
      console.log(data);

      const surfaces = data.map((item: CityData) => item.surface);
      const prices = data.map((item: CityData) => item.price);
      const { min, max } = addYAxisPadding(prices);

      setLatestPricesChartData(prevData => ({
        ...prevData,
        options: {
          ...prevData.options,
          xaxis: { ...prevData.options.xaxis, categories: surfaces },
          yaxis: { 
            ...prevData.options.yaxis, 
            min: min,
            max: max,
          },
        },
        series: [{ name: '€', data: prices }]
      }));

      setChartVisible(true);
      setLatestPricesChartLoaded(true);
    } catch (error) {
      console.error("Error fetching latest prices data:", error);
    }
  };

  const handleActionButtonClick = () => {
    setAction((prevAction) => (prevAction === "Rent" ? "Buy" : "Rent"));
    clearLatestPricesChartData();
    clearHistoricalChartData();
    setChartVisible(false);
    setLatestPricesChartLoaded(false);
    setHistoricalDataChartLoaded(false);
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
    clearLatestPricesChartData();
    clearHistoricalChartData();
    setChartVisible(false);
    setLatestPricesChartLoaded(false);
    setHistoricalDataChartLoaded(false);
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
    clearLatestPricesChartData();
    clearHistoricalChartData();
    setChartVisible(false);
    setLatestPricesChartLoaded(false);
    setHistoricalDataChartLoaded(false);
  };

  const handleSeePricesClick = async () => {
    clearHistoricalChartData();
    setActiveHeaderButton('Latest Prices');
    setChartVisible(false);
    if (activeHeaderButton === 'Latest Prices') {
      await fetchLatestPricesData();
    } else if (activeHeaderButton === 'Historical Data') {
      await fetchHistoricalData(selectedSurface, selectedTimeframe);
    }
  };

  const handleHeaderButtonClick = (buttonName: string) => {
    setActiveHeaderButton(buttonName);
    setChartVisible(false);

    if (buttonName === 'Historical Data' && !historicalDataChartLoaded) {
      fetchHistoricalData(selectedSurface, selectedTimeframe);
    } else if (buttonName === 'Latest Prices' && latestPricesChartLoaded) {
      setChartVisible(true);
    } else if (buttonName === 'Historical Data' && historicalDataChartLoaded) {
      setChartVisible(true);
    }
  };

  const handleSurfaceChange = (surface: number) => {
    setSelectedSurface(surface);
  };

  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
  };

  const handleRefreshClick = async () => {
    if (selectedSurface !== previousSurface || selectedTimeframe !== previousTimeframe) {
      await fetchHistoricalData(selectedSurface, selectedTimeframe);
      setPreviousSurface(selectedSurface);
      setPreviousTimeframe(selectedTimeframe);
    }
  };

  const buttonStyle = "bg-gray-700 hover:bg-black text-white py-2 px-4 rounded w-48 h-12";
  const headerButtonStyle = (buttonName: string) => ({
    background: 'transparent',
    color: 'black',
    padding: '0.5rem 1.6rem',
    fontSize: '1.125rem',
    border: 'none',
    cursor: 'pointer',
    textDecoration: activeHeaderButton === buttonName ? 'underline' : 'none',
    textDecorationColor: activeHeaderButton === buttonName ? 'orange' : 'transparent',
    textDecorationThickness: activeHeaderButton === buttonName ? '2px' : '0px',
    fontWeight: activeHeaderButton === buttonName ? 'bold' : 'normal',
  });

  const shouldShowSeePricesButton = () => {
    if (action === "Action" || selectedCity === "Location") return false;
    if ((selectedCity === "Athens" || selectedCity === "Thessaloniki") && selectedArea === "Area") return false;
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
    marginRight: 'auto',
    position: 'relative',
    display: 'inline-block',
  };

  const underlineStyle: CSSProperties = {
    position: 'absolute',
    content: '""',
    width: '100%',
    height: '2px',
    backgroundColor: 'transparent',
    bottom: '2px',
    left: '0',
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
    marginTop: '2rem',
  };

  const chartContainerStyle: CSSProperties = {
    flex: 1,
    marginLeft: '2rem',
  };

  const headerButtonsContainerStyle: CSSProperties = {
    marginTop: '0.5rem',
    display: 'flex',
    gap: '1rem',
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-25%)',
  };

  const renderContent = () => {
    switch (activeHeaderButton) {
      case 'Latest Prices':
        return isChartVisible && <LatestPrices chartData={latestPricesChartData} />;
      case 'Historical Data':
        return isChartVisible && <HistoricalData chartData={historicalDataChartData} onSurfaceChange={handleSurfaceChange} onTimeframeChange={handleTimeframeChange} selectedSurface={selectedSurface} selectedTimeframe={selectedTimeframe} onRefresh={handleRefreshClick} />;
      case 'Compare Prices':
        return <ComparePrices />;
      default:
        return null;
    }
  };

  return (
    <div style={mainContainerStyle}>
      <header style={headerStyle}>
        <h1 style={h1Style} className="text-5xl font-extrabold text-gray-700 relative">
          hompare
          <span style={underlineStyle}></span>
        </h1>
        <div style={headerButtonsContainerStyle}>
          <button
            style={headerButtonStyle('Latest Prices')}
            onClick={() => handleHeaderButtonClick('Latest Prices')}
          >
            Latest Prices
          </button>
          <button
            style={headerButtonStyle('Historical Data')}
            onClick={() => handleHeaderButtonClick('Historical Data')}
          >
            Historical Data
          </button>
          <button
            style={headerButtonStyle('Compare Prices')}
            onClick={() => handleHeaderButtonClick('Compare Prices')}
          >
            Compare Prices
          </button>
        </div>
      </header>
      <main className="flex flex-col items-start justify-start p-8 flex-grow">
        <div style={contentStyle}>
          <div style={buttonsContainerStyle}>
            <button onClick={handleActionButtonClick} className={buttonStyle}>
              {action}
            </button>
            <div className="relative flex items-center w-48">
              <button onClick={handleLocationButtonClick} className={buttonStyle}>
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
                <button onClick={handleAreaButtonClick} className={buttonStyle}>
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
              <button onClick={handleSeePricesClick} className={`${buttonStyle} bg-orange-700 hover:bg-orange-600`}>
                See Prices
              </button>
            )}
          </div>
          <div style={chartContainerStyle}>
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
