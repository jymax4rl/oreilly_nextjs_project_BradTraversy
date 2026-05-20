"use client";
import { useEffect, useState, useRef } from "react";

const AMENITIES = [
  { id: "wifi", label: "Wifi" },
  { id: "kitchen", label: "Full Kitchen" },
  { id: "washer_dryer", label: "Washer & Dryer" },
  { id: "free_parking", label: "Free Parking" },
  { id: "pool", label: "Swimming Pool" },
  { id: "hot_tub", label: "Hot Tub" },
  { id: "24_7_security", label: "24/7 Security" },
  { id: "24_7_electricity", label: "24/7 Electricity" },
  { id: "wheelchair", label: "Wheelchair Accessible" },
  { id: "elevator", label: "Elevator" },
  { id: "dishwasher", label: "Dishwasher" },
  { id: "gym", label: "Gym" },
  { id: "ac", label: "Air Conditioning" },
  { id: "patio", label: "Balcony/Patio" },
  { id: "smart_tv", label: "Smart TV" },
];

const PHOTO_SUGGESTIONS = [
  { id: "exterior", label: "Exterior", hint: "Front of the home or building" },
  { id: "living", label: "Living room", hint: "Lounge or saloon — seating area" },
  { id: "kitchen", label: "Kitchen", hint: "Cooking area, appliances, counters" },
  { id: "bedroom", label: "Bedroom", hint: "Each bedroom guests will use" },
  { id: "bathroom", label: "Bathroom", hint: "Shower, tub, sink" },
  { id: "toilet", label: "Toilet", hint: "WC if separate from bathroom" },
  { id: "balcony", label: "Balcony", hint: "Balcony, terrace, or patio" },
  { id: "garden", label: "Garden", hint: "Yard, pool, or outdoor space" },
];

const STEPS = [
  "Property type",
  "Listing details",
  "Location",
  "Amenities",
  "Pricing",
  "Photos & contact",
];

const STEP_PANEL_CLASS =
  "h-full w-full shrink-0 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6";

const emptyFields = {
  name: "",
  description: "",
  location: {
    country: "Kenya",
    street: "",
    city: "",
    state: "",
    zipcode: "",
  },
  beds: "",
  baths: "",
  square_feet: "",
  amenities: [],
  rates: {
    nightly: "",
    weekly: "",
    monthly: "",
  },
  seller_info: {
    name: "",
    email: "",
    phone: "",
  },
};

const PropertyAddForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [propertyType, setPropertyType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fields, setFields] = useState(emptyFields);
  const stepViewportRef = useRef(null);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [imagePreviews]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [outerKey, innerKey] = name.split(".");
      setFields((prevFields) => ({
        ...prevFields,
        [outerKey]: {
          ...prevFields[outerKey],
          [innerKey]: value,
        },
      }));
    } else {
      setFields((prevFields) => ({
        ...prevFields,
        [name]: value,
      }));
    }
  };

  const handleAmenitiesChange = (e) => {
    const { value, checked } = e.target;
    const updatedAmenities = [...fields.amenities];
    if (checked) {
      if (!updatedAmenities.includes(value)) updatedAmenities.push(value);
    } else {
      const index = updatedAmenities.indexOf(value);
      if (index > -1) updatedAmenities.splice(index, 1);
    }
    setFields((prevFields) => ({
      ...prevFields,
      amenities: updatedAmenities,
    }));
  };
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioBlob(blob);
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Microphone access is required to record audio.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      // Stop all tracks to release microphone
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  const deleteAudio = () => {
    setAudioUrl(null);
    setAudioBlob(null);
  };

  const handleImageChange = (e) => {
    const { files } = e.target;
    if (!files?.length) return;
    imagePreviews.forEach((p) => URL.revokeObjectURL(p.url));
    const previews = Array.from(files).map((file) => ({
      name: file.name.length > 24 ? `${file.name.slice(0, 24)}…` : file.name,
      url: URL.createObjectURL(file),
    }));
    setImagePreviews(previews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.target);

    if (audioBlob) {
      formData.append("audio", audioBlob, "recording.wav");
    }

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        body: formData,
      });

      if (res.ok && res.redirected) {
        window.location.href = res.url;
      } else if (!res.ok) {
        alert("Could not save listing. Check required fields and try again.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const propertyOptions = [
    {
      value: "Apartment",
      label: "Apartment",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
          />
        </svg>
      ),
    },
    {
      value: "Condo",
      label: "Condo",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5M12 6.75h1.5m-3 3.75h1.5m1.5 0h1.5m-3 3.75h1.5m1.5 0h1.5M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
          />
        </svg>
      ),
    },
    {
      value: "House",
      label: "House",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
          />
        </svg>
      ),
    },
    {
      value: "CabinOrCottage",
      label: "Cabin",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72l1.189-1.19A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"
          />
        </svg>
      ),
    },
    {
      value: "Room",
      label: "Room",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
          />
        </svg>
      ),
    },
    {
      value: "Studio",
      label: "Studio",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
          />
        </svg>
      ),
    },
    {
      value: "Other",
      label: "Other",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 16 16"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
          />
        </svg>
      ),
    },
  ];

  const nextStep = (e) => {
    e.preventDefault();
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = (e) => {
    e.preventDefault();
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  useEffect(() => {
    const panels = stepViewportRef.current?.querySelectorAll("[data-step-panel]");
    panels?.[currentStep]?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  return (
    <div
      className="flex h-screen max-h-screen w-full flex-col overflow-hidden bg-slate-50 supports-[height:100dvh]:h-[100dvh] supports-[height:100dvh]:max-h-[100dvh]"
      aria-label="Add property listing"
    >
      <div className="mx-auto flex h-full w-full min-h-0 max-w-3xl flex-1 flex-col overflow-hidden px-4 pb-4 pt-20 sm:px-6 sm:pt-24">
        <header className="mb-4 shrink-0 sm:mb-5">
          <p className="text-sm font-medium text-blue-600">Host listing</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Add your property
          </h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}
          </p>
          <div
            className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={handleSubmit}
            aria-label={`Add property — step ${currentStep + 1} of ${STEPS.length}`}
          >
            <div
              ref={stepViewportRef}
              className="relative min-h-0 flex-1 overflow-hidden"
              aria-live="polite"
            >
              <div
                className="flex h-full w-full transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentStep * 100}%)` }}
              >
              {/* Step 1: Property type */}
              <div data-step-panel className={STEP_PANEL_CLASS}>
                <label className="mb-4 block text-base font-semibold text-slate-900">
                  What kind of place is it?
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {propertyOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPropertyType(option.value)}
                      className={`
                          relative w-full cursor-pointer rounded-2xl border p-3 sm:p-4 flex flex-col items-center justify-center gap-2 sm:gap-3 transition-all min-h-[5.5rem] sm:min-h-[6.5rem] touch-manipulation
                          ${
                            propertyType === option.value
                              ? "border-blue-600 bg-blue-50 ring-2 ring-blue-600/30 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-400 active:bg-slate-50"
                          }
                        `}
                    >
                      <div
                        className={`transition-colors ${
                          propertyType === option.value
                            ? "text-gray-900"
                            : "text-gray-500"
                        }`}
                      >
                        {option.icon}
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          propertyType === option.value
                            ? "text-gray-900"
                            : "text-gray-600"
                        }`}
                      >
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
                {/* Hidden input to pass the value to the form handler */}
                <input type="hidden" name="type" value={propertyType} required />
              </div>
              {/*Step 2: Listing name & description */}
              <div data-step-panel className={STEP_PANEL_CLASS}>
                <div className="my-4 ">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Listing Name
                  </label>
                  <input
                    value={fields.name}
                    onChange={handleChange}
                    type="text"
                    id="name"
                    name="name"
                    className="w-full rounded-xl border-gray-200 bg-gray-50 p-4 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="e.g. Beautiful Apartment In Miami"
                    required
                  />
                </div>

                <div className="my-4">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Description
                  </label>
                  <textarea
                    value={fields.description}
                    onChange={handleChange}
                    id="description"
                    name="description"
                    className="w-full rounded-xl border-gray-200 bg-gray-50 p-4 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                    rows="5"
                    placeholder="Tell us about your property..."
                    required
                  ></textarea>
                  {/* Audio Recorder UI */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Audio Description
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                      {!recording ? (
                        <button
                          type="button"
                          onClick={startRecording}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          Start Recording
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition animate-pulse"
                        >
                          Stop Recording
                        </button>
                      )}
                      {audioUrl && (
                        <div className="flex items-center gap-2">
                          <audio controls src={audioUrl} className="h-10" />
                          <button
                            type="button"
                            onClick={deleteAudio}
                            className="text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* --- STEP 2: Location --- */}
              <div data-step-panel className={STEP_PANEL_CLASS}>
                <div className="space-y-6 max-w-2xl lg:max-w-4xl lg:mx-auto">
                  <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Where is it located?
                    </h3>
                    <div className="space-y-4">
                      <input
                        value={fields.location.street}
                        onChange={handleChange}
                        type="text"
                        id="street"
                        name="location.street"
                        className="w-full rounded-xl border-white bg-white shadow-sm p-4 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Street Address"
                      />
                      <input
                        value={fields.location.city}
                        onChange={handleChange}
                        type="text"
                        id="city"
                        name="location.city"
                        className="w-full rounded-xl border-white bg-white shadow-sm p-4 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="City"
                        required
                      />
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <input
                          value={fields.location.state}
                          onChange={handleChange}
                          type="text"
                          id="state"
                          name="location.state"
                          className="w-full rounded-xl border-slate-200 bg-slate-50 p-4 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none sm:w-1/2"
                          placeholder="State / county"
                          required
                        />
                        <input
                          value={fields.location.zipcode}
                          onChange={handleChange}
                          type="text"
                          id="zipcode"
                          name="location.zipcode"
                          className="w-full rounded-xl border-slate-200 bg-slate-50 p-4 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none sm:w-1/2"
                          placeholder="Postal code"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* --- STEP 3: Details & Amenities --- */}
              <div data-step-panel className={STEP_PANEL_CLASS}>
                <div className="lg:max-w-6xl mx-auto space-y-8">
                  {/* Specs */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                        Beds
                      </label>
                      <input
                        value={fields.beds}
                        onChange={handleChange}
                        type="number"
                        id="beds"
                        name="beds"
                        className="w-full text-center rounded-xl border-gray-200 bg-gray-50 p-3 font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                        Baths
                      </label>
                      <input
                        value={fields.baths}
                        onChange={handleChange}
                        type="number"
                        id="baths"
                        name="baths"
                        className="w-full text-center rounded-xl border-gray-200 bg-gray-50 p-3 font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                        Sq Ft
                      </label>
                      <input
                        value={fields.square_feet}
                        onChange={handleChange}
                        type="number"
                        id="square_feet"
                        name="square_feet"
                        className="w-full text-center rounded-xl border-gray-200 bg-gray-50 p-3 font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Amenities Grid */}
                  <div className=" ">
                    <label className="block text-lg font-semibold text-gray-900 mb-4">
                      What does it offer?
                    </label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {AMENITIES.map((amenity) => (
                        <label
                          key={amenity.id}
                          className="relative flex min-h-[44px] cursor-pointer items-center rounded-xl border border-slate-200 p-3 transition-colors hover:bg-slate-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 touch-manipulation"
                        >
                          <input
                            type="checkbox"
                            id={`amenity_${amenity.id}`}
                            name="amenities"
                            value={amenity.label}
                            checked={fields.amenities.includes(amenity.label)}
                            onChange={handleAmenitiesChange}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                          />
                          <span className="text-sm text-gray-700 font-medium">
                            {amenity.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* --- STEP 4: Rates --- */}
              <div data-step-panel className={STEP_PANEL_CLASS}>
                <div className="max-w-2xl mx-auto">
                  <div className="bg-green-50 rounded-3xl p-8 border border-green-100 text-center space-y-6">
                    <h3 className="text-xl font-bold text-green-900">
                      Set Your Pricing
                    </h3>
                    <p className="text-green-700/80 text-sm">
                      Leave fields blank if they don't apply.
                    </p>

                    <div className="space-y-4">
                      <div className="relative">
                        <label
                          htmlFor="weekly_rate"
                          className="absolute left-4 top-3 text-xs font-bold text-green-700 uppercase"
                        >
                          Weekly Rate
                        </label>
                        <input
                          type="number"
                          id="weekly_rate"
                          name="rates.weekly"
                          className="w-full rounded-xl border-transparent bg-white shadow-sm pt-8 pb-3 px-4 text-lg font-semibold text-gray-900 focus:ring-2 focus:ring-green-500 outline-none placeholder:text-gray-300"
                          placeholder="$0"
                          value={fields.rates.weekly}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="relative">
                        <label
                          htmlFor="monthly_rate"
                          className="absolute left-4 top-3 text-xs font-bold text-green-700 uppercase"
                        >
                          Monthly Rate
                        </label>
                        <input
                          type="number"
                          id="monthly_rate"
                          name="rates.monthly"
                          className="w-full rounded-xl border-transparent bg-white shadow-sm pt-8 pb-3 px-4 text-lg font-semibold text-gray-900 focus:ring-2 focus:ring-green-500 outline-none placeholder:text-gray-300"
                          placeholder="$0"
                          value={fields.rates.monthly}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="relative">
                        <label
                          htmlFor="nightly_rate"
                          className="absolute left-4 top-3 text-xs font-bold text-green-700 uppercase"
                        >
                          Nightly Rate
                        </label>
                        <input
                          type="number"
                          id="nightly_rate"
                          name="rates.nightly"
                          className="w-full rounded-xl border-transparent bg-white shadow-sm pt-8 pb-3 px-4 text-lg font-semibold text-gray-900 focus:ring-2 focus:ring-green-500 outline-none placeholder:text-gray-300"
                          placeholder="$0"
                          value={fields.rates.nightly}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* --- STEP 5: Contact & Images --- */}
              <div data-step-panel className={STEP_PANEL_CLASS}>
                <div className="max-w-2xl mx-auto space-y-8">
                  {/* Contact Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Seller Information
                    </h3>
                    <input
                      type="text"
                      name="seller_info.name"
                      className="w-full rounded-xl border-gray-200 bg-gray-50 p-4 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Seller Name"
                      value={fields.seller_info.name}
                      onChange={handleChange}
                    />
                    <input
                      type="email"
                      name="seller_info.email"
                      className="w-full rounded-xl border-gray-200 bg-gray-50 p-4 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Email Address"
                      required
                      value={fields.seller_info.email}
                      onChange={handleChange}
                    />
                    <input
                      type="tel"
                      name="seller_info.phone"
                      className="w-full rounded-xl border-gray-200 bg-gray-50 p-4 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Phone Number"
                      value={fields.seller_info.phone}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Photos */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Property photos
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Clear, well-lit photos help guests book with confidence.
                        Include as many of these areas as you can:
                      </p>
                    </div>
                    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {PHOTO_SUGGESTIONS.map((shot) => (
                        <li
                          key={shot.id}
                          className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left"
                        >
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                            ✓
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-slate-900">
                              {shot.label}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {shot.hint}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>

                    <label
                      htmlFor="images"
                      className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/50 active:bg-blue-50 touch-manipulation"
                    >
                    <div className="mx-auto mb-3 h-10 w-10 text-slate-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                        />
                      </svg>
                    </div>
                      <span className="text-sm font-semibold text-blue-600">
                        Tap to add photos
                      </span>
                      <span className="mt-1 text-xs text-slate-500">
                        JPG or PNG · multiple files · up to 10MB each
                      </span>
                      <input
                        type="file"
                        id="images"
                        name="images"
                        className="sr-only"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        required
                      />
                    </label>

                    {imagePreviews.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm font-medium text-slate-700">
                          {imagePreviews.length} photo
                          {imagePreviews.length === 1 ? "" : "s"} selected
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {imagePreviews.map((preview, index) => (
                            <figure
                              key={`${preview.name}-${index}`}
                              className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={preview.url}
                                alt={preview.name}
                                className="aspect-[4/3] w-full object-cover"
                              />
                              <figcaption className="truncate px-2 py-1 text-xs text-slate-600">
                                {preview.name}
                              </figcaption>
                            </figure>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <nav
              className="sticky bottom-0 z-10 flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-white p-4 sm:p-6"
              aria-label="Form navigation"
            >
              <button
                type="button"
                onClick={prevStep}
                aria-hidden={currentStep === 0}
                tabIndex={currentStep === 0 ? -1 : 0}
                className={`min-h-[44px] rounded-xl px-6 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  currentStep === 0
                    ? "pointer-events-none opacity-0"
                    : "opacity-100"
                }`}
              >
                Back
              </button>
              {currentStep === STEPS.length - 1 ? (
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[44px] rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:scale-95 disabled:opacity-60 sm:px-8"
                >
                  {submitting ? "Saving…" : "Complete listing"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:scale-95 sm:px-8"
                >
                  Next Step
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </button>
              )}
            </nav>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PropertyAddForm;
