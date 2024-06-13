"use client";

import React, { useState, useEffect, useRef, CSSProperties } from "react";
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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

const HistoricalData: React.FC<{ chartData: ChartData, onTimeframeChange: (timeframe: string) => void, selectedTimeframe: string, onRefresh: () => void, startDate: Date | null, endDate: Date | null, setStartDate: (date: Date | null) => void, setEndDate: (date: Date | null) => void, isVisible: boolean }> = ({ chartData, onTimeframeChange, selectedTimeframe, onRefresh, startDate, endDate, setStartDate, setEndDate, isVisible }) => {
  const [timeframeDropdownVisible, setTimeframeDropdownVisible] = useState(false);
  const chartRef = useRef<any>(null);

  const buttonStyle = "bg-gray-700 hover:bg-black text-white py-2 px-4 rounded w-48 h-12";
  const datePickerStyle = "bg-white border border-gray-300 rounded py-2 px-4 text-black w-full h-full";

  useEffect(() => {
    if (chartRef.current && chartData.series[0].data.length > 0) {
      chartRef.current.chart.updateSeries(chartData.series);
    }
  }, [chartData]);

  if (!isVisible) {
    return null;
  }

  // return (
  //   <div className="flex flex-col space-y-4">
  //     <div className="relative">
  //       <button className={`${buttonStyle}`} onClick={() => setTimeframeDropdownVisible(prev => !prev)}>
  //         {selectedTimeframe || "Timeframe"}
  //       </button>
  //       {timeframeDropdownVisible && (
  //         <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded shadow-lg z-10 max-h-60 overflow-y-auto">
  //           <ul className="py-1 text-black">
  //             {["last week", "last month", "last 6 months", "last year", "ever", "custom"].map((timeframe) => (
  //               <li
  //                 key={timeframe}
  //                 className="px-4 py-2 hover:bg-gray-200 cursor-pointer text-black"
  //                 onClick={() => {
  //                   onTimeframeChange(timeframe);
  //                   setTimeframeDropdownVisible(false);
  //                 }}
  //               >
  //                 {timeframe}
  //               </li>
  //             ))}
  //           </ul>
  //         </div>
  //       )}
  //     </div>
  //     {selectedTimeframe === "custom" && (
  //       <div className="relative flex flex-col space-y-2 items-start w-48">
  //         <div className="w-48 h-12">
  //           <DatePicker
  //             selected={startDate}
  //             onChange={(date: Date | null) => setStartDate(date)}
  //             selectsStart
  //             startDate={startDate}
  //             endDate={endDate}
  //             maxDate={new Date()}
  //             dateFormat="dd MMMM yyyy"
  //             placeholderText="Start Date"
  //             className="bg-white border border-gray-300 rounded py-2 px-4 text-black w-full h-full"
  //             showPopperArrow={false}
  //             shouldCloseOnSelect={false}
  //           />
  //         </div>
  //         <div className="w-48 h-12">
  //           <DatePicker
  //             selected={endDate}
  //             onChange={(date: Date | null) => setEndDate(date)}
  //             selectsEnd
  //             startDate={startDate}
  //             endDate={endDate}
  //             minDate={startDate}
  //             maxDate={new Date()}
  //             dateFormat="dd MMMM yyyy"
  //             placeholderText="End Date"
  //             className="bg-white border border-gray-300 rounded py-2 px-4 text-black w-full h-full"
  //             showPopperArrow={false}
  //             shouldCloseOnSelect={false}
  //           />
  //         </div>
  //       </div>
  //     )}
  //     <button className={`${buttonStyle} border-2 border-orange-500 hover:border-transparent hover:text-white`} onClick={onRefresh}>
  //       Refresh Chart
  //     </button>
  //   </div>
  // );
};

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

  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("");
  const [previousTimeframe, setPreviousTimeframe] = useState<string>("");
  const [previousAction, setPreviousAction] = useState("Rent");
  const [previousCity, setPreviousCity] = useState("City");
  const [previousArea, setPreviousArea] = useState("Area");
  const [timeframeDropdownVisible, setTimeframeDropdownVisible] = useState(false);
  const [renderHistoricalDataChart, setRenderHistoricalDataChart] = useState(true);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

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

  const fetchHistoricalData = async (timeframe: string) => {
    const city = selectedCity;
    const area = (city === "Athens" || city === "Thessaloniki") ? selectedArea : city;

    try {
      setHistoricalDataChartData(initialHistoricalChartData);

      let fetchStartDate = '';
      let fetchEndDate = new Date().toISOString();

      if (timeframe === "last week") {
        fetchStartDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (timeframe === "last month") {
        fetchStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (timeframe === "last 6 months") {
        fetchStartDate = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (timeframe === "last year") {
        fetchStartDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      } else if (timeframe === "ever") {
        fetchStartDate = new Date(0).toISOString();
      } else if (timeframe === "custom" && startDate && endDate) {
        fetchStartDate = startDate.toISOString();
        fetchEndDate = endDate.toISOString();
      }

      const response = await fetch(`/api/getHistoricalPpm?action=${action}&city=${city}&area=${area}&startDate=${fetchStartDate}&endDate=${fetchEndDate}`);
      const data = await response.json();
      console.log(data);

      const dates = data.map((item: { date: string }) => item.date);
      const prices = data.map((item: { pricePerSqm: number }) => item.pricePerSqm);
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
          name: '€ per m²', 
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

  const handleHeaderButtonClick = async (buttonName: string) => {
    setActiveHeaderButton(buttonName);
    setChartVisible(false);

    if (buttonName === 'Historical Data') {
      setSelectedTimeframe("");
      setHistoricalDataChartLoaded(false);
    }
  };

  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
  };

  const handleRefreshClick = async () => {
    if (selectedTimeframe !== previousTimeframe) {
      setChartVisible(false);
      clearHistoricalChartData();
      await fetchHistoricalData(selectedTimeframe);
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
            onTimeframeChange={handleTimeframeChange}
            selectedTimeframe={selectedTimeframe}
            onRefresh={handleRefreshClick}
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
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
            Data Graph
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
            <div className="flex flex-col space-y-4 mt-4">
              <div className="relative">
                <button className={`${buttonStyle}`} onClick={() => setTimeframeDropdownVisible(prev => !prev)}>
                  {selectedTimeframe || "Timeframe"}
                </button>
                {timeframeDropdownVisible && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded shadow-lg z-10 max-h-60 overflow-y-auto">
                    <ul className="py-1 text-black">
                      {["last week", "last month", "last 6 months", "last year", "ever", "custom"].map((timeframe) => (
                        <li
                          key={timeframe}
                          className="px-4 py-2 hover:bg-gray-200 cursor-pointer text-black"
                          onClick={() => {
                            handleTimeframeChange(timeframe);
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
              {selectedTimeframe === "custom" && (
                <div className="relative flex flex-col space-y-2 items-start w-48">
                  <div className="w-48 h-12">
                    <DatePicker
                      selected={startDate}
                      onChange={(date: Date | null) => setStartDate(date)}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      maxDate={new Date()}
                      dateFormat="dd MMMM yyyy"
                      placeholderText="Start Date"
                      className="bg-white border border-gray-300 rounded py-2 px-4 text-black w-full h-full"
                      showPopperArrow={false}
                      shouldCloseOnSelect={false}
                    />
                  </div>
                  <div className="w-48 h-12">
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
                      className="bg-white border border-gray-300 rounded py-2 px-4 text-black w-full h-full"
                      showPopperArrow={false}
                      shouldCloseOnSelect={false}
                    />
                  </div>
                </div>
              )}
              <button className={`${buttonStyle} border-2 border-orange-500 hover:border-transparent hover:text-white`} onClick={handleRefreshClick}>
                Refresh Chart
              </button>
            </div>
          </div>
          <div style={chartContainerStyle}>
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
