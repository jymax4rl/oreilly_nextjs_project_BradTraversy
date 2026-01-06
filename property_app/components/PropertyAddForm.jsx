"use client";
import { useState } from "react";

const PropertyAddForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [fileNames, setFileNames] = useState([]);
  const [propertyType, setPropertyType] = useState("");
  const amenities = [
    { id: "wifi", label: "Wifi" },
    { id: "kitchen", label: "Full Kitchen" },
    { id: "washer_dryer", label: "Washer & Dryer" },
    { id: "free_parking", label: "Free Parking" },
    { id: "pool", label: "Swimming Pool" },
    { id: "hot_tub", label: "Hot Tub" },
    { id: "24_7_security", label: "24/7 Security" },
    { id: "wheelchair", label: "Wheelchair Accessible" },
    { id: "elevator", label: "Elevator" },
    { id: "dishwasher", label: "Dishwasher" },
    { id: "gym", label: "Gym" },
    { id: "ac", label: "Air Conditioning" },
    { id: "patio", label: "Balcony/Patio" },
    { id: "smart_tv", label: "Smart TV" },
  ];
  const [fields, setFields] = useState({
    owner: "4",
    name: "Karen Suburb Cottage",
    type: "Cottage Or Cabin",
    description:
      "Experience tranquility in this cozy cottage located in Karen.",
    location: {
      country: "Kenya",
      street: "789 Karen Lane",
      city: "Nairobi",
      state: "Nairobi County",
      zipcode: "00502",
    },
    beds: 2,
    baths: 1,
    square_feet: 1100,
    amenities: [
      "Wifi",
      "Free Parking",
      "Swimming Pool",
      "Hot Tub",
      "24/7 Security",
      "Wheelchair Accessible",
      "Elevator",
      "Dishwasher",
      "Gym",
      "Air Conditioning",
      "Balcony/Patio",
      "Smart TV",
    ],
    rates: {
      nightly: 120,
      weekly: 750,
    },
    seller_info: {
      name: "Robert Anderson",
      email: "robert@gmail.com",
      phone: "254-700-555556",
    },
    images: ["g1.jpg", "g2.jpg", "g3.jpg"],
    is_featured: false,
    createdAt: "2024-01-07T00:00:00.000Z",
    updatedAt: "2024-01-07T00:00:00.000Z",
  });

  //check if the name includes a dot or nested object
  const handleChange = (e) => {
    console.log("Target", e.target);
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
      //not nested object
      setFields((prevFields) => ({
        ...prevFields,
        [name]: value,
      }));
    }
    console.log("InnerKey", prevFields);
  };
  const handleAmenitiesChange = (e) => {
    const { value, checked } = e.target;

    //clone the current array
    const updatedAmenities = [...fields.amenities];
    if (checked) {
      updatedAmenities.push(value);
      console.log("Checked", value);
      console.log("UpdatedAmenities", updatedAmenities);
    } else {
      // remove the value from the array
      const index = updatedAmenities.indexOf(value);
      updatedAmenities.splice(index, 1);
      console.log("Unchecked", value);
      console.log("Index", index);
      console.log("UpdatedAmenities", updatedAmenities);
    }
    setFields((prevFields) => ({
      ...prevFields,
      amenities: updatedAmenities,
    }));
  };
  const handleImageChange = (e) => {
    const { files } = e.target;
    if (files && files.length > 0) {
      const newFileNames = Array.from(files).map((file) => {
        const name = file.name;
        return name.length > 20 ? `${name.substring(0, 20)}...` : name;
      });
      setFileNames(newFileNames);
    }
  };

  const steps = [
    "Property Type",
    "Listing Name",
    "Description",
    "Location",
    "Amenities",
    "Price",
  ];

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
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = (e) => {
    e.preventDefault();
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Handler to fix the "action" prop warning in client-side preview
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addProperty(formData);
  };

  return (
    <div className="h-screen min-w-full overflow-x-hidden">
      <div className="container mx-auto w-full ">
        <div className="bg-white shadow-md rounded-md ">
          <form className="w-full" onSubmit={handleSubmit}>
            {/* The Slider Track */}
            <div
              className="flex-1 w-full flex lg:gap-4 transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentStep * 100}%)` }}
            >
              {/*Step 1: Modern Grid Selection */}
              <div className="w-full flex-shrink-0 lg:px-2 px-0 py-2 overflow-y-auto">
                <label className="block text-sm font-medium text-gray-900 mb-4">
                  Property Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:p-3 ">
                  {propertyOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => setPropertyType(option.value)}
                      className={`
                          relative lg:w-48 w-32 cursor-pointer m-auto rounded-xl border p-4 flex flex-col items-center justify-center gap-4 transition-all aspect-[4/3 ] sm:aspect-square
                          ${
                            propertyType === option.value
                              ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900 shadow-sm"
                              : "border-gray-200 hover:border-gray-900 hover:shadow-md bg-white"
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
                    </div>
                  ))}
                </div>
                {/* Hidden input to pass the value to the form handler */}
                <input type="hidden" name="type" value={propertyType} />
              </div>
              {/*Step 2: Listing name & description */}
              <div className="w-full flex-shrink-0 lg:px-20  px-5 overflow-y-auto">
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
                </div>
              </div>
              {/* --- STEP 2: Location --- */}
              <div className="w-full flex-shrink-0 px-8 py-4 overflow-y-auto ">
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
                      <div className="flex gap-4">
                        <input
                          value={fields.location.state}
                          onChange={handleChange}
                          type="text"
                          id="state"
                          name="location.state"
                          className="w-1/2 rounded-xl border-white bg-white shadow-sm p-4 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="State"
                          required
                        />
                        <input
                          value={fields.location.zipcode}
                          onChange={handleChange}
                          type="text"
                          id="zipcode"
                          name="location.zipcode"
                          className="w-1/2 rounded-xl border-white bg-white shadow-sm p-4 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Zipcode"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* --- STEP 3: Details & Amenities --- */}
              <div className="w-full flex-shrink-0 px-8 py-4 overflow-y-auto">
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
                    <div className="grid lg:grid-cols-4 md:grid-cols-3 grid-cols-2 gap-3">
                      {amenities.map((amenity) => (
                        <label
                          key={amenity.id}
                          className="relative flex items-center p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
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
              <div className="w-full flex-shrink-0 px-8 py-4 overflow-y-auto">
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
              <div className="w-full flex-shrink-0 px-8 py-4 overflow-y-auto">
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

                  {/* Image Upload */}
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:bg-gray-50 transition-colors">
                    <div className="mx-auto h-12 w-12 text-gray-400 mb-3">
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
                    <label
                      htmlFor="images"
                      className="block text-sm font-medium text-gray-900 cursor-pointer"
                    >
                      <span className="text-blue-600 hover:text-blue-500">
                        Upload images
                      </span>{" "}
                      or drag and drop
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF up to 10MB
                    </p>
                    <input
                      type="file"
                      id="images"
                      name="images"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      required
                    />
                    {fileNames.map((name, index) => (
                      <p key={index} className="text-gray-500">
                        {name}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </form>
          <div className="p-8 border-t border-gray-100 bg-white flex justify-between items-center z-10">
            <button
              onClick={prevStep}
              className={`px-6 py-3 cursor-pointer rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors ${
                currentStep === 0
                  ? "opacity-0 pointer-events-none"
                  : "opacity-100"
              }`}
            >
              Back
            </button>
            {currentStep === steps.length - 1 ? (
              <button
                type="submit"
                className="lg:px-8 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all active:scale-95"
              >
                Complete Listing
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="cursor-pointer lg:px-8 px-4 py-3 rounded-xl bg-gray-900 text-white font-semibold shadow-lg hover:bg-black hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2"
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyAddForm;
