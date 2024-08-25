"use client";

import React, { useState, useEffect, useRef, CSSProperties, useCallback } from "react";
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import enTranslations from './locales/en.json';
import grTranslations from './locales/gr.json';
import { useMediaQuery } from 'react-responsive';
import { format } from 'date-fns';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface CityData {
  surface: number;
  price: number;
  entry_date: string;
}

interface ChartData {
  options: ApexOptions;
  series: { name: string; data: number[] }[];
}


const translations = {
  en: enTranslations,
  gr: grTranslations,
};

const HistoricalData: React.FC<{ chartData: ChartData, onTimeframeChange: (timeframe: string) => void, selectedTimeframe: string, onRefresh: () => void, startDate: Date | null, endDate: Date | null, setStartDate: (date: Date | null) => void, setEndDate: (date: Date | null) => void, isVisible: boolean }> = ({ chartData, onTimeframeChange, selectedTimeframe, onRefresh, startDate, endDate, setStartDate, setEndDate, isVisible }) => {
  const [timeframeDropdownVisible, setTimeframeDropdownVisible] = useState(false);
  const chartRef = useRef<any>(null);
  const isMobile = useMediaQuery({ query: '(max-width: 767px)' });

  useEffect(() => {
    if (chartRef.current && chartRef.current.chart && chartData.series[0].data.length > 0) {
      chartRef.current.chart.updateSeries(chartData.series);
    }
  }, [chartData]);

  useEffect(() => {
    const chartContainer = chartRef.current?.container;

    const handleTouchMove = (event: TouchEvent) => {
      if (chartContainer && event.target instanceof Node && chartContainer.contains(event.target)) {
        event.preventDefault();
      }
    };

    if (isMobile && chartContainer) {
      chartContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    return () => {
      if (chartContainer) {
        chartContainer.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [isMobile]);

  if (!isVisible) {
    return null;
  }

  return (
    <div ref={chartRef}>
      {chartData.series[0].data.length > 0 && (
        <Chart
          options={chartData.options}
          series={chartData.series}
          type="area"
          height={400}
          width="100%"
        />
      )}
    </div>
  );
};

export default function Home() {
  const [language, setLanguage] = useState<'en' | 'gr'>('en');
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
  const [isLoading, setIsLoading] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const loadingPlaceholderRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery({ query: '(max-width: 767px)' });
  const [isChartRendered, setIsChartRendered] = useState(false);

  const isFetchingDataRef = useRef(false);

  const initialHistoricalChartData: ChartData = {
    options: {
      chart: {
        type: 'area',
        background: 'transparent',
        toolbar: { show: false },
        zoom: { enabled: false },
        events: {
          mouseMove: function(event, chartContext, config) {
            const tooltip = chartContext.el.querySelector('.apexcharts-tooltip');
            if (tooltip) {
              tooltip.style.top = '10px';
              tooltip.style.left = '55px';
            }
          }
        }
      },
      tooltip: {
        x: {
          formatter: () => '',
        },
        y: {
          formatter: function(value: number, { dataPointIndex, w }: { dataPointIndex: number, w: any }) {
            const date = w.globals.categoryLabels[dataPointIndex];
            return date;
          }
        },
        marker: { show: false },
        theme: 'dark',
        style: { fontSize: '20px', fontFamily: undefined },
        fixed: {
          enabled: true,
          position: 'topLeft',
          offsetX: 55,
          offsetY: 10,
        },
      },
      markers: {
        size: isMobile ? 0 : 4,
        colors: ['#ff4d00'],
        strokeColors: '#ff4d00',
        radius: 10,
        strokeWidth: 5
      },
      stroke: { curve: 'smooth', width: 2 },
      dataLabels: { enabled: !isMobile, formatter: (val: number) => `${val}€` },
      xaxis: {
        tooltip: {
          enabled: false
        },
        categories: [],
        labels: { rotate: -90, style: { colors: 'black', fontSize: '0px' }, show: false }
      },
      yaxis: {
        axisTicks: {
          show: true,
        },
        forceNiceScale: true,
        labels: { style: { colors: 'black', fontSize: '0px' }, show: false },
        min: undefined,
        max: undefined,
      },
      colors: ['#ff4d00'],
    },
    series: [{ name: '€', data: [] }]
  };

  const [historicalDataChartData, setHistoricalDataChartData] = useState<ChartData>(initialHistoricalChartData);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("");
  const [previousValues, setPreviousValues] = useState({ action: "", city: "", area: "", timeframe: "", startDate: null as Date | null, endDate: null as Date | null });
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !dropdownRef.current?.contains(event.target as Node) &&
        !cityButtonRef.current?.contains(event.target as Node)
      ) {
        setDropdownVisible(false);
      }
      if (
        !areaDropdownRef.current?.contains(event.target as Node) &&
        !areaButtonRef.current?.contains(event.target as Node)
      ) {
        setAreaDropdownVisible(false);
      }
      if (
        !timeframeDropdownRef.current?.contains(event.target as Node) &&
        !timeframeButtonRef.current?.contains(event.target as Node)
      ) {
        setTimeframeDropdownVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const cityButtonRef = useRef<HTMLButtonElement>(null);
  const areaDropdownRef = useRef<HTMLDivElement>(null);
  const areaButtonRef = useRef<HTMLButtonElement>(null);
  const timeframeDropdownRef = useRef<HTMLDivElement>(null);
  const timeframeButtonRef = useRef<HTMLButtonElement>(null);

  const clearHistoricalChartData = useCallback(() => {
    setHistoricalDataChartData((prevData: ChartData) => ({
      ...prevData,
      series: [{ name: '€', data: [] }],
      options: { ...prevData.options, xaxis: { ...prevData.options.xaxis, categories: [] } }
    }));
  }, []);

  const clearCharts = useCallback(() => {
    clearHistoricalChartData();
  }, [clearHistoricalChartData]);

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

        const dates = data.map((item: { date: string }) => format(new Date(item.date), 'd MMM'));
        const prices = data.map((item: { pricePerSqm: number }) => item.pricePerSqm);
        const { min, max } = addYAxisPadding(prices);

        const options: ApexOptions = {
            ...initialHistoricalChartData.options,
            xaxis: {
                ...initialHistoricalChartData.options?.xaxis,
                categories: dates,
            },
            yaxis: {
                ...initialHistoricalChartData.options?.yaxis,
                min: min,
                max: max,
            },
            tooltip: {
                x: {
                  formatter: function(value, { seriesIndex, dataPointIndex, w }) {
                      const price = w.globals.series[seriesIndex][dataPointIndex];
                      const seriesColor = w.config.colors ? w.config.colors[seriesIndex] : '#000';
                      return `1m² costs: <span style="color: ${seriesColor}; font-weight: bold; font-size: 28px;">${price.toFixed(1)}€</span>`;
                  }
              },

                y: {
                    formatter: function(value, { dataPointIndex, w }) {
                        const date = w.globals.categoryLabels[dataPointIndex];
                        return date;
                    }
                },
                theme: 'light',
                marker: { show: false },
                style: {
                    fontSize: '15px',
                    fontFamily: undefined
                },
                fixed: {
                    enabled: true,
                    position: 'topLeft',
                    offsetX: 55,
                    offsetY: 10,
                },
            },
            chart: {
                type: 'area',
                background: 'transparent',
                toolbar: { show: false },
                zoom: { enabled: false },
                events: {
                    mouseMove: function(event, chartContext, config) {
                        const tooltip = chartContext.el.querySelector('.apexcharts-tooltip');
                        if (tooltip) {
                            tooltip.style.top = '10px';
                            tooltip.style.left = '55px';
                        }
                    }
                }
            }
        };

        setHistoricalDataChartData({
            ...initialHistoricalChartData,
            options: options,
            series: [{ 
                name: '',
                data: prices
            }]
        });

        setRenderHistoricalDataChart(false);
        setTimeout(() => setRenderHistoricalDataChart(true), 0);

        setChartVisible(true);
        setHistoricalDataChartLoaded(true);
        setIsChartRendered(true);

        setPreviousValues({
            action,
            city: selectedCity,
            area: selectedArea,
            timeframe: selectedTimeframe,
            startDate,
            endDate
        });
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
    isFetchingDataRef.current = true;

    const currentValues = {
      action,
      city: selectedCity,
      area: selectedArea,
      timeframe: selectedTimeframe,
      startDate,
      endDate,
    };
  
    if (
      selectedTimeframe &&
      selectedCity !== "City" &&
      (selectedCity !== "Athens" && selectedCity !== "Thessaloniki") || selectedArea !== "Area" &&
      (
        currentValues.action !== previousValues.action ||
        currentValues.city !== previousValues.city ||
        currentValues.area !== previousValues.area ||
        currentValues.timeframe !== previousValues.timeframe ||
        currentValues.startDate !== previousValues.startDate ||
        currentValues.endDate !== previousValues.endDate
      )
    ) {
      if (selectedTimeframe === "custom" && (!startDate || !endDate)) {
        alert("Please select both start and end dates for custom timeframe.");
        return;
      }
  
      setIsLoading(true);
      setChartVisible(false);
      clearHistoricalChartData();
      await fetchHistoricalData(selectedTimeframe);
      setIsLoading(false);
  
      setChartVisible(true);
      setIsChartRendered(true);
    } else {
      alert("Please select valid inputs and ensure that they have changed before refreshing the chart.");
    }

    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
      isFetchingDataRef.current = false;
    }, 100);
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
    textDecorationColor: activeHeaderButton === buttonName ? '#ff4d00' : 'transparent',
    textDecorationThickness: activeHeaderButton === buttonName ? '3px' : '0px',
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
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    position: 'absolute',
    right: '4rem',
  };

  const languageDropdownStyle: CSSProperties = {
    marginLeft: '8rem',
  };

  const renderTimeframeOptions = () => {
    const timeframeOptions = [
      { key: "last week", label: t("lastWeek") },
      { key: "last month", label: t("lastMonth") },
      { key: "last 6 months", label: t("last6Months") },
      { key: "last year", label: t("lastYear") },
      { key: "ever", label: t("ever") },
      { key: "custom", label: t("custom") }
    ];

    return timeframeOptions.map(option => (
      <li
        key={option.key}
        className="px-4 py-2 hover:bg-gray-200 cursor-pointer text-black"
        onClick={() => {
          handleTimeframeChange(option.key);
          setTimeframeDropdownVisible(false);
        }}
      >
        {option.label}
      </li>
    ));
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-96">
          <div ref={loadingPlaceholderRef} className="glare-placeholder w-full h-full relative">
            <div className="loading-text">h o m p a r e</div>
          </div>
        </div>
      );
    }
  
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
      default:
        return null;
    }
  };
  
  const t = (key: string) => translations[language][key as keyof typeof translations['en']] || key;

  const handleLanguageChange = (lang: 'en' | 'gr') => {
    setLanguage(lang);

    setSelectedArea(prev => t(prev));
    setSelectedTimeframe(prev => t(prev));
  };

  return (
    <div className="main-container">
      <header className="header">
        <h1 className="text-5xl font-extrabold text-gray-700 relative">
          hompare
        </h1>
        <div className="header-buttons-container">
          <button
            style={headerButtonStyle('Historical Data')}
            onClick={() => handleHeaderButtonClick('Historical Data')}
          >
            {t('dataGraph')}
          </button>
          <select
            onChange={(e) => handleLanguageChange(e.target.value as 'en' | 'gr')}
            value={language}
            className="bg-transparent hover:bg-gray-100 text-black py-2 px-4 rounded language-dropdown"
          >
            <option value="en">English</option>
            <option value="gr">Ελληνικά</option>
          </select>
        </div>
      </header>

      <main className="flex flex-col items-start justify-start p-8 flex-grow content">
        <div className="buttons-container">
          <div className="flex items-center w-48">
            <button
              onClick={() => handleActionButtonClick("Rent")}
              className={`${buttonStyle} ${action === "Rent" ? "bg-orange-700" : "bg-gray-700"} hover:bg-orange-600`}
              style={{ marginRight: "8px" }}
            >
              {t('actionRent')}
            </button>
            <button
              onClick={() => handleActionButtonClick("Buy")}
              className={`${buttonStyle} ${action === "Buy" ? "bg-orange-700" : "bg-gray-700"} hover:bg-orange-600`}
            >
              {t('actionBuy')}
            </button>
          </div>
          <div className="relative flex items-center w-48">
            <button
              ref={cityButtonRef}
              onClick={handleLocationButtonClick}
              className={buttonStyle}
            >
              {t(selectedCity === "City" ? "city" : selectedCity)}
            </button>
            {isDropdownVisible && (
              <div ref={dropdownRef} className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded shadow-lg z-10 max-h-60 overflow-y-auto">
                <input
                  type="text"
                  placeholder={t('searchCity')}
                  value={citySearchTerm}
                  onChange={(e) => setCitySearchTerm(e.target.value)}
                  className="sticky top-0 p-2 border-b w-full text-orange-600 bg-white z-20"
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
              <button
                ref={areaButtonRef}
                onClick={handleAreaButtonClick}
                className={buttonStyle}
              >
                {t(selectedArea === "Area" ? "area" : selectedArea)}
              </button>
              {isAreaDropdownVisible && (
                <div ref={areaDropdownRef} className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded shadow-lg z-10 max-h-60 overflow-y-auto">
                  <input
                    type="text"
                    placeholder={t('searchArea')}
                    value={areaSearchTerm}
                    onChange={(e) => setAreaSearchTerm(e.target.value)}
                    className="sticky top-0 p-2 border-b w-full text-orange-600 bg-white z-20"
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
          <div className="flex flex-col space-y-4 mt-0">
            <div className="relative">
              <button
                ref={timeframeButtonRef}
                className={`${buttonStyle} mt-0`}
                onClick={() => setTimeframeDropdownVisible(prev => !prev)}
              >
                {t(selectedTimeframe) || t('timeframe')}
              </button>
              {timeframeDropdownVisible && (
                <div ref={timeframeDropdownRef} className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded shadow-lg z-10 max-h-60 overflow-y-auto">
                  <ul className="py-1 text-black">
                    {renderTimeframeOptions()}
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
                    placeholderText={t('from')}
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
                    placeholderText={t('to')}
                    className="bg-white border border-gray-300 rounded py-2 px-4 text-black w-full h-full"
                    showPopperArrow={false}
                    shouldCloseOnSelect={false}
                  />
                </div>
              </div>
            )}
            <button className="bg-orange-700 hover:bg-orange-600 text-white py-2 px-4 rounded w-48 h-12 mt-2" onClick={handleRefreshClick}>
              {t('refreshChart')}
            </button>
          </div>
        </div>
        <div ref={chartContainerRef} className="chart-container">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
