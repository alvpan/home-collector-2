"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import enTranslations from './locales/en.json';
import grTranslations from './locales/gr.json';
import { useMediaQuery } from 'react-responsive';
import { format } from 'date-fns';
import { Euro, TrendingUp, CheckCheck } from 'lucide-react';


const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface ChartData {
  options: ApexOptions;
  series: { name: string; data: number[] }[];
}

const translations = {
  en: enTranslations,
  gr: grTranslations,
};

const HistoricalData: React.FC<{
  chartData: ChartData;
  onTimeframeChange: (timeframe: string) => void;
  selectedTimeframe: string;
  onRefresh: () => void;
  startDate: Date | null;
  endDate: Date | null;
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;
  isVisible: boolean;
}> = ({
  chartData,
  onTimeframeChange,
  selectedTimeframe,
  onRefresh,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  isVisible
}) => {
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
  const [language, setLanguage] = useState<'en' | 'gr'>('gr');
  const t = (key: string) => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  const [isActionChosen, setIsActionChosen] = useState(false);
  const [action, setAction] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isAreaDropdownVisible, setAreaDropdownVisible] = useState(false);
  const [areaSearchTerm, setAreaSearchTerm] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState("");
  const [activeHeaderButton, setActiveHeaderButton] = useState<string>('Historical Data');
  const [isChartVisible, setChartVisible] = useState(false);
  const [historicalDataChartLoaded, setHistoricalDataChartLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const loadingPlaceholderRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery({ query: '(max-width: 767px)' });
  const [isChartRendered, setIsChartRendered] = useState(false);
  const isFetchingDataRef = useRef(false);
  const [hasRefreshed, setHasRefreshed] = useState(false);

  const words = ["Real Estate Prices", "Over Time", "Always Current"];
  const displayWords = [...words, words[0]];
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [noTransition, setNoTransition] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex >= displayWords.length) {
          setNoTransition(true);
          return 0;
        }
        return nextIndex;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [displayWords.length]);

  useEffect(() => {
    if (noTransition) {
      const timeout = setTimeout(() => {
        setNoTransition(false);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [noTransition]);

  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
  };

  const handleActionButtonClick = (selectedAction: string) => {
    setAction(selectedAction);
    clearCharts();
    setChartVisible(false);
    setHistoricalDataChartLoaded(false);
    setIsActionChosen(true);
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setCitySearchTerm("");
    setDropdownVisible(false);
    setAreas([]);
    setSelectedArea("");
    setAreaDropdownVisible(false);
    clearCharts();
    setChartVisible(false);
    setHistoricalDataChartLoaded(false);
  };

  const handleAreaSelect = (area: string) => {
    setSelectedArea(area);
    setAreaSearchTerm("");
    setAreaDropdownVisible(false);
    clearCharts();
    setChartVisible(false);
    setHistoricalDataChartLoaded(false);
  };

  const initialHistoricalChartData: ChartData = {
    options: {
      chart: {
        type: 'area',
        background: 'transparent',
        toolbar: { show: false },
        zoom: { enabled: false },
        events: {
          mouseMove: function(event, chartContext) {
            const tooltip = chartContext.el.querySelector('.apexcharts-tooltip');
            if (tooltip) {
              tooltip.style.top = '10px';
              tooltip.style.left = '55px';
            }
          }
        }
      },
      tooltip: {
        x: { formatter: () => '' },
        y: {
          formatter: (value: number, { dataPointIndex, w }) => {
            const date = w.globals.categoryLabels[dataPointIndex];
            return date;
          }
        },
        marker: { show: false },
        theme: 'dark',
        style: { fontSize: '20px' },
        fixed: {
          enabled: true,
          position: 'topLeft',
          offsetX: 55,
          offsetY: 10,
        },
      },
      markers: {
        size: isMobile ? 0 : 0,
        colors: ['#ff4d00'],
        strokeColors: '#ff4d00',
        radius: 10,
        strokeWidth: 5
      },
      stroke: { curve: 'smooth', width: 2 },
      dataLabels: { enabled: false },
      xaxis: {
        tooltip: { enabled: false },
        categories: [],
        labels: { rotate: -90, style: { colors: 'black', fontSize: '0px' }, show: false }
      },
      yaxis: {
        axisTicks: { show: true },
        forceNiceScale: true,
        labels: { style: { colors: 'black', fontSize: '0px' }, show: false },
      },
      colors: ['#ff4d00'],
    },
    series: [{ name: '€', data: [] }]
  };

  const [historicalDataChartData, setHistoricalDataChartData] =
    useState<ChartData>(initialHistoricalChartData);

  const [previousValues, setPreviousValues] = useState({
    action: "",
    city: "",
    area: "",
    timeframe: "",
    startDate: null as Date | null,
    endDate: null as Date | null
  });

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
    if (selectedCity !== "") {
      const fetchAreas = async () => {
        try {
          const response = await fetch(`/api/getAreas?city=${selectedCity}`);
          const data = await response.json();
          setAreas(data.areas);
        } catch (error) {
          console.error("Error fetching areas:", error);
        }
      };
      fetchAreas();
    }
  }, [selectedCity]);

  useEffect(() => {
    if (
      action !== "" &&
      selectedCity !== "" &&
      ((selectedCity !== "Athens" && selectedCity !== "Thessaloniki") || selectedArea !== "")
    ) {
      setChartVisible(false);
      setHistoricalDataChartLoaded(false);
      clearCharts();
    }
  }, [action, selectedCity, selectedArea]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node) &&
          !cityButtonRef.current?.contains(event.target as Node)) {
        setDropdownVisible(false);
      }
      if (!areaDropdownRef.current?.contains(event.target as Node) &&
          !areaButtonRef.current?.contains(event.target as Node)) {
        setAreaDropdownVisible(false);
      }
      if (!timeframeDropdownRef.current?.contains(event.target as Node) &&
          !timeframeButtonRef.current?.contains(event.target as Node)) {
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
    setHistoricalDataChartData((prevData) => ({
      ...prevData,
      series: [{ name: '€', data: [] }],
      options: {
        ...prevData.options,
        xaxis: { ...prevData.options.xaxis, categories: [] }
      }
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

      if (timeframe === "lastMonth") {
        fetchStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (timeframe === "last6Months") {
        fetchStartDate = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (timeframe === "lastYear") {
        fetchStartDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      } else if (timeframe === "ever") {
        fetchStartDate = new Date(0).toISOString();
      } else if (timeframe === "custom" && startDate && endDate) {
        fetchStartDate = startDate.toISOString();
        fetchEndDate = endDate.toISOString();
      }

      const response = await fetch(
        `/api/getHistoricalPpm?action=${action}&city=${city}&area=${area}&startDate=${fetchStartDate}&endDate=${fetchEndDate}`
      );
      const data = await response.json();
      const dates = data.map((item: { date: string }) => format(new Date(item.date), 'd MMM'));
      const prices = data.map((item: { pricePerSqm: number }) => item.pricePerSqm);
      const averagePrice =
        prices.length > 0
          ? prices.reduce((acc: number, val: number) => acc + val, 0) / prices.length
          : 0;
      const { min, max } = addYAxisPadding(prices);

      const options: ApexOptions = {
        ...initialHistoricalChartData.options,
        xaxis: {
          ...initialHistoricalChartData.options?.xaxis,
          categories: dates,
        },
        yaxis: {
          ...initialHistoricalChartData.options?.yaxis,
          min,
          max,
        },
        annotations: {
          yaxis: [
            {
              y: averagePrice,
              borderColor: '#3c0061',
              strokeDashArray: 4,
              borderWidth: 2,
              label: {
                borderColor: '#3c0061',
                style: {
                  color: '#3c0061',
                  background: '#f2f2f2',
                  fontWeight: 'bold',
                  fontSize: '14px',
                },
                text: `Avg: ${averagePrice.toFixed(1)}€`,
              },
            },
          ],
        },
        tooltip: {
          x: {
            formatter(value, { seriesIndex, dataPointIndex, w }) {
              const price = w.globals.series[seriesIndex][dataPointIndex];
              const seriesColor = w.config.colors ? w.config.colors[seriesIndex] : '#000';
              return `1m² costs: <span style="color: ${seriesColor}; font-weight: bold; font-size: 28px;">${price.toFixed(1)}€</span>`;
            }
          },
          y: {
            formatter(value, { dataPointIndex, w }) {
              const date = w.globals.categoryLabels[dataPointIndex];
              return date;
            }
          },
          theme: 'light',
          marker: { show: false },
          style: { fontSize: '15px' },
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
            mouseMove(event, chartContext) {
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
        options,
        series: [{ name: '', data: prices }],
        
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
      selectedCity !== "" &&
      ((selectedCity !== "Athens" && selectedCity !== "Thessaloniki") || selectedArea !== "") &&
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
      setHasRefreshed(true);
    } else {
      alert("Please select valid inputs and ensure that they have changed before refreshing the chart.");
    }

    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      isFetchingDataRef.current = false;
    }, 100);
  };

  const filteredCities = cities.filter(city =>
    t(city).toLowerCase().includes(citySearchTerm.toLowerCase())
  );
  const filteredAreas = areas.filter(area =>
    t(area).toLowerCase().includes(areaSearchTerm.toLowerCase())
  );

  const actionButtonBase =
    "flex items-center justify-center whitespace-nowrap text-center w-24 h-12 font-bold text-[15px] border rounded";

  const rentButtonClass =
    action === "Rent"
      ? `${actionButtonBase} bg-orange-600 text-white border-orange-600`
      : `${actionButtonBase} bg-transparent text-gray-400 border border-gray-300 hover:bg-gray-200 hover:text-gray-500 hover:border-gray-300`;

  const buyButtonClass =
    action === "Buy"
      ? `${actionButtonBase} bg-orange-600 text-white border-orange-600`
      : `${actionButtonBase} bg-transparent text-gray-400 border border-gray-300 hover:bg-gray-200 hover:text-gray-500 hover:border-gray-300`;

  const finalRentButtonClass = isActionChosen
    ? rentButtonClass
    : `${rentButtonClass} animated-border`;

  const finalBuyButtonClass = isActionChosen
    ? buyButtonClass
    : `${buyButtonClass} animated-border`;

  const shouldShowHistoricalData = () => {
    return (
      selectedCity !== "" &&
      ((selectedCity !== "Athens" && selectedCity !== "Thessaloniki") || selectedArea !== "")
    );
  };

  const renderTimeframeOptions = () => {
    const timeframeOptions = [
      { key: "lastMonth", label: t("lastMonth") },
      { key: "last6Months", label: t("last6Months") },
      { key: "lastYear", label: t("lastYear") },
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
    if (!hasRefreshed) {
      const style = {
        transform: `translateX(-${carouselIndex * 100}%)`,
        transition: noTransition ? 'none' : 'transform 0.5s ease-in-out'
      };
      const displayWordsWithIcons = [
        { text: "Real Estate Prices", icon: <Euro className="mr-2 text-gray-600" size={28} strokeWidth={3} /> },
        { text: "Over Time", icon: <TrendingUp className="mr-2 text-gray-600" size={28} strokeWidth={3} /> },
        { text: "Always Current", icon: <CheckCheck className="mr-2 text-gray-600" size={28} strokeWidth={3} /> },
        { text: "Real Estate Prices", icon: <Euro className="mr-2 text-gray-600" size={28} strokeWidth={3} /> }
      ];

      return (
        <div className="flex justify-center items-center h-96">
          <div className="carousel-container relative overflow-hidden">
            <div className="words-slider flex" style={style}>
              {displayWordsWithIcons.map((item, i) => (
                <div key={i} className="word-slide w-[300px] flex items-center justify-center">
                  {item.icon}
                  <span className="text-3xl font-bold text-gray-600">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    return (
      renderHistoricalDataChart && (
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
      )
    );
  };

  const handleLanguageChange = (lang: 'en' | 'gr') => {
    setLanguage(lang);
  };

  const isRefreshButtonVisible =
    action !== "" &&
    selectedCity !== "" &&
    selectedTimeframe !== "" &&
    ((selectedCity !== "Athens" && selectedCity !== "Thessaloniki") || selectedArea !== "");

  return (
    <div className="main-container">
      <header className="header">
        <h1 className="text-5xl font-extrabold text-gray-700 relative">
          hompare
        </h1>
        <div className="header-buttons-container">
          <select
            onChange={(e) => handleLanguageChange(e.target.value as 'en' | 'gr')}
            value={language}
            className="bg-transparent hover:bg-gray-100 hover:border-orange-600 text-black py-2 px-4 rounded language-dropdown"
          >
            <option value="en">🇬🇧 English</option>
            <option value="gr">🇬🇷 Ελληνικά</option>
          </select>
        </div>
      </header>

      <main className="flex flex-col items-start justify-start px-16 py-8 flex-grow content">
        <div className="buttons-container flex flex-col space-y-2">
          <div className="flex space-x-2">
            <button
              onClick={() => handleActionButtonClick("Rent")}
              className={finalRentButtonClass}
            >
              {t('actionRent')}
            </button>
            <button
              onClick={() => handleActionButtonClick("Buy")}
              className={finalBuyButtonClass}
            >
              {t('actionBuy')}
            </button>
          </div>

          {action !== "" && (
            <div className="relative">
              <button
                ref={cityButtonRef}
                onClick={() => setDropdownVisible(!isDropdownVisible)}
                className="flex items-center justify-center whitespace-nowrap text-center w-[12.5rem] h-12 font-bold text-[15px] border rounded bg-gray-200 text-gray-800 border-gray-400 hover:bg-orange-600 hover:text-white hover:border-orange-600"
              >
                {selectedCity === "" ? t("city") : t(selectedCity)}
              </button>
              {isDropdownVisible && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 max-h-60 overflow-y-auto"
                >
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
                        {t(city)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {action !== "" && selectedCity !== "" && (selectedCity === "Athens" || selectedCity === "Thessaloniki") && (
            <div className="relative">
              <button
                ref={areaButtonRef}
                onClick={() => setAreaDropdownVisible(!isAreaDropdownVisible)}
                className="flex items-center justify-center whitespace-nowrap text-center w-[12.5rem] h-12 font-bold text-[15px] border rounded bg-gray-200 text-gray-800 border-gray-400 hover:bg-orange-600 hover:text-white hover:border-orange-600"
              >
                {selectedArea === "" ? t("area") : t(selectedArea)}
              </button>
              {isAreaDropdownVisible && (
                <div
                  ref={areaDropdownRef}
                  className="absolute top-full mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 max-h-60 overflow-y-auto"
                >
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
                        {t(area)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {action !== "" && selectedCity !== "" && ((selectedCity !== "Athens" && selectedCity !== "Thessaloniki") || selectedArea !== "") && (
            <>
              <div className="relative">
                <button
                  ref={timeframeButtonRef}
                  className="flex items-center justify-center whitespace-nowrap text-center w-[12.5rem] h-12 font-bold text-[15px] border rounded bg-gray-200 text-gray-800 border-gray-400 hover:bg-orange-600 hover:text-white hover:border-orange-600"
                  onClick={() => setTimeframeDropdownVisible(prev => !prev)}
                >
                  {t(selectedTimeframe) || t('timeframe')}
                </button>
                {timeframeDropdownVisible && (
                  <div
                    ref={timeframeDropdownRef}
                    className="absolute top-full mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 max-h-60 overflow-y-auto"
                  >
                    <ul className="py-1 text-black">
                      {renderTimeframeOptions()}
                    </ul>
                  </div>
                )}
              </div>

              {selectedTimeframe === "custom" && (
                <div className="flex flex-col space-y-2">
                  <div className="w-[12.5rem] h-12">
                    <DatePicker
                      selected={startDate}
                      onChange={(date) => setStartDate(date)}
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
                  <div className="w-[12.5rem] h-12">
                    <DatePicker
                      selected={endDate}
                      onChange={(date) => setEndDate(date)}
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

              {isRefreshButtonVisible && (
                <div>
                  <button
                    className="flex items-center justify-center whitespace-nowrap text-center bg-green-600 hover:bg-green-700 text-white font-bold text-[15px] py-2 px-4 rounded-full h-12 w-[12.5rem]"
                    onClick={handleRefreshClick}
                  >
                    {t('refreshChart')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div ref={chartContainerRef} className="chart-container mt-4">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
