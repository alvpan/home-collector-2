"use client";

import React, { useState, useEffect, useRef, CSSProperties } from "react";
import dynamic from 'next/dynamic';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
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

const ComparePrices: React.FC = () => {
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const charCode = event.charCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  };

  const formatNumber = (value: string) => {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleSurfaceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\./g, '');
    event.target.value = formatNumber(value);
  };

  const handlePriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\./g, '');
    event.target.value = formatNumber(value);
  };

  const inputStyle = {
    WebkitAppearance: "none" as const,
    MozAppearance: "textfield" as const,
    fontWeight: "600",
    paddingRight: "2.5rem",
    borderColor: "gray",
    backgroundColor: "white",
    outline: "none",
    borderWidth: "2px",
    width: "100%",
  };

  const wrapperStyle: CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    width: "192px",
  };

  const symbolStyle: CSSProperties = {
    position: "absolute",
    right: "0.5rem",
    color: "gray", 
    pointerEvents: "none",
  };

  const customStyles = `
    input:focus {
      border-color: orange !important; // Change border color on focus
      border-width: 4px !important; // Increase border width on focus
    }
  `;

  return (
    <>
      <style>{customStyles}</style> {/* Add the custom styles */}
      <div className="flex flex-col space-y-2 max-w-xs">
        <div style={wrapperStyle}>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Enter Surface"
            className="p-2 border rounded text-orange-500"
            onKeyPress={handleKeyPress}
            onChange={handleSurfaceChange}
            style={inputStyle}
          />
          <span style={symbolStyle}>m²</span>
        </div>
        <div style={wrapperStyle}>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Enter Price"
            className="p-2 border rounded text-orange-500"
            onKeyPress={handleKeyPress}
            onChange={handlePriceChange}
            style={inputStyle}
          />
          <span style={symbolStyle}>€</span>
        </div>
        <button className="bg-transparent hover:bg-black text-black py-2 px-4 rounded border-2 border-orange-500 hover:border-transparent hover:text-white w-48 h-12">
          Evaluate
        </button>
      </div>
    </>
  );
};

const HistoricalData: React.FC<{ chartData: ChartData, onSurfaceChange: (surface: number) => void, onTimeframeChange: (timeframe: string) => void, selectedSurface: number | null, selectedTimeframe: string, onRefresh: () => void, isVisible: boolean }> = ({ chartData, onSurfaceChange, onTimeframeChange, selectedSurface, selectedTimeframe, onRefresh, isVisible }) => {
  const [surfaceDropdownVisible, setSurfaceDropdownVisible] = useState(false);
  const [timeframeDropdownVisible, setTimeframeDropdownVisible] = useState(false);
  const chartRef = useRef<any>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    if (chartRef.current && chartData.series[0].data.length > 0) {
      chartRef.current.chart.updateSeries(chartData.series);
    }
  }, [chartData]);

  if (!isVisible) {
    return null;
  }

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
                    {surface}
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
        <div className="relative flex space-x-2 items-center">
          <DatePicker
            selected={startDate}
            onChange={(date: Date | null) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            maxDate={new Date()}
            dateFormat="dd MMMM yyyy"
            placeholderText="Start Date"
            className="bg-white border border-gray-300 rounded py-2 px-4 text-black"
            showPopperArrow={false}
            shouldCloseOnSelect={false}
          />
          <DatePicker
            selected={endDate}
            onChange={(date: Date | null) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            maxDate={new Date()}
            dateFormat="dd MMMM yyyy"
            placeholderText="End Date"
            className="bg-white border border-gray-300 rounded py-2 px-4 text-black"
            showPopperArrow={false}
            shouldCloseOnSelect={false}
          />
        </div>
        <button className="bg-transparent hover:bg-black text-black py-2 px-4 rounded border-2 border-orange-500 hover:border-transparent hover:text-white" onClick={onRefresh}>
          Refresh Chart
        </button>
      </div>
      <Chart
        ref={chartRef}
        options={chartData.options}
        series={chartData.series}
        type="area"
        height="400"
      />
    </div>
  );
};

export default function Home() {
  const [action, setAction] = useState("Rent");
  const [selectedCity, setSelectedCity] = useState("City");
  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isAreaDropdownVisible, setAreaDropdownVisible] = useState(false);
  const [areaSearchTerm, setAreaSearchTerm] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState("Area");
  const [activeHeaderButton, setActiveHeaderButton] = useState<string>('Historical Data');
  const [isChartVisible, setChartVisible] = useState(false);
  const [historicalDataChartLoaded, setHistoricalDataChartLoaded] = useState(false);

  const initialHistoricalChartData: ChartData = {
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
  };

  const [historicalDataChartData, setHistoricalDataChartData] = useState<ChartData>(initialHistoricalChartData);

  const [selectedSurface, setSelectedSurface] = useState<number | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("");
  const [previousSurface, setPreviousSurface] = useState<number | null>(null);
  const [previousTimeframe, setPreviousTimeframe] = useState<string>("");
  const [previousAction, setPreviousAction] = useState("Rent");
  const [previousCity, setPreviousCity] = useState("City");
  const [previousArea, setPreviousArea] = useState("Area");
  const [surfaceDropdownVisible, setSurfaceDropdownVisible] = useState(false);
  const [timeframeDropdownVisible, setTimeframeDropdownVisible] = useState(false);
  const [renderHistoricalDataChart, setRenderHistoricalDataChart] = useState(true);

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
    if (action !== "Rent" && selectedCity !== "City" && (selectedCity !== "Athens" && selectedCity !== "Thessaloniki" || selectedArea !== "Area")) {
      setChartVisible(false);
      setHistoricalDataChartLoaded(false);
      clearCharts();
    }
  }, [action, selectedCity, selectedArea]);

  const clearHistoricalChartData = () => {
    setHistoricalDataChartData(prevData => ({
      ...prevData,
      series: [{ name: '€', data: [] }],
      options: { ...prevData.options, xaxis: { ...prevData.options.xaxis, categories: [] } }
    }));
  };

  const clearCharts = () => {
    clearHistoricalChartData();
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
      setHistoricalDataChartData(initialHistoricalChartData);

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
          xaxis: { 
            ...prevData.options.xaxis, 
            categories: dates
          },
          yaxis: { 
            ...prevData.options.yaxis, 
            min: min,
            max: max,
          },
        },
        series: [{ 
          name: '€', 
          data: prices
        }]
      }));

      setRenderHistoricalDataChart(false);
      setTimeout(() => setRenderHistoricalDataChart(true), 0);

      setChartVisible(true);
      setHistoricalDataChartLoaded(true);
    } catch (error) {
      console.error("Error fetching historical data:", error);
    }
  };

  const handleActionButtonClick = (selectedAction: string) => {
    setAction(selectedAction);
    clearCharts();
    setChartVisible(false);
    setHistoricalDataChartLoaded(false);
  };

  const handleLocationButtonClick = () => {
    setDropdownVisible(!isDropdownVisible);
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setCitySearchTerm("");
    setDropdownVisible(false);
    setAreas([]);
    setSelectedArea("Area");
    setAreaDropdownVisible(false);
    clearCharts();
    setChartVisible(false);
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
    setAreaSearchTerm("");
    setAreaDropdownVisible(false);
    clearCharts();
    setChartVisible(false);
    setHistoricalDataChartLoaded(false);
  };

  const handleSeePricesClick = async () => {
    setActiveHeaderButton('Historical Data');
    clearCharts();
    setChartVisible(false);
    setHistoricalDataChartLoaded(false);
    if (action !== previousAction || selectedCity !== previousCity || selectedArea !== previousArea) {
      await fetchHistoricalData(selectedSurface as number, selectedTimeframe);
      setPreviousAction(action);
      setPreviousCity(selectedCity);
      setPreviousArea(selectedArea);
    }

    setHistoricalDataChartData(initialHistoricalChartData);
  };

  const handleHeaderButtonClick = async (buttonName: string) => {
    setActiveHeaderButton(buttonName);
    setChartVisible(false);

    if (buttonName === 'Historical Data') {
      setSelectedSurface(null);
      setSelectedTimeframe("");
      setHistoricalDataChartLoaded(false);
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
      setChartVisible(false);
      clearHistoricalChartData();
      await fetchHistoricalData(selectedSurface as number, selectedTimeframe);
      setPreviousSurface(selectedSurface);
      setPreviousTimeframe(selectedTimeframe);
      setChartVisible(true);
    }
  };

  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(citySearchTerm.toLowerCase())
  );

  const filteredAreas = areas.filter(area =>
    area.toLowerCase().includes(areaSearchTerm.toLowerCase())
  );

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
    if (selectedCity === "City") return false;
    if ((selectedCity === "Athens" || selectedCity === "Thessaloniki") && selectedArea === "Area") return false;
    return true;
  };

  const shouldShowHistoricalData = () => {
    return selectedCity !== "City" && (selectedCity !== "Athens" && selectedCity !== "Thessaloniki" || selectedArea !== "Area");
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
      case 'Historical Data':
        return (
          renderHistoricalDataChart &&
          <HistoricalData
            chartData={historicalDataChartData}
            onSurfaceChange={handleSurfaceChange}
            onTimeframeChange={handleTimeframeChange}
            selectedSurface={selectedSurface}
            selectedTimeframe={selectedTimeframe}
            onRefresh={handleRefreshClick}
            isVisible={shouldShowHistoricalData()}
          />
        );
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
            <div className="flex items-center w-48">
              <button 
                onClick={() => handleActionButtonClick("Rent")} 
                className={`${buttonStyle} ${action === "Rent" ? "bg-orange-700" : "bg-gray-700"} hover:bg-orange-600`}
                style={{ marginRight: "8px" }}
              >
                Rent
              </button>
              <button 
                onClick={() => handleActionButtonClick("Buy")} 
                className={`${buttonStyle} ${action === "Buy" ? "bg-orange-700" : "bg-gray-700"} hover:bg-orange-600`}
              >
                Buy
              </button>
            </div>
            <div className="relative flex items-center w-48">
              <button onClick={handleLocationButtonClick} className={buttonStyle}>
                {selectedCity}
              </button>
              {isDropdownVisible && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded shadow-lg z-10 max-h-60 overflow-y-auto">
                  <input 
                    type="text"
                    placeholder="Search City"
                    value={citySearchTerm}
                    onChange={(e) => setCitySearchTerm(e.target.value)}
                    className="sticky top-0 p-2 border-b w-full text-orange-500 bg-white z-20"
                  />
                  <ul className="py-1 text-black">
                    {filteredCities.map((city) => (
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
                  <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded shadow-lg z-10 max-h-60 overflow-y-auto">
                    <input 
                      type="text"
                      placeholder="Search Area"
                      value={areaSearchTerm}
                      onChange={(e) => setAreaSearchTerm(e.target.value)}
                      className="sticky top-0 p-2 border-b w-full text-orange-500 bg-white z-20"
                    />
                    <ul className="py-1 text-black">
                      {filteredAreas.map((area) => (
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