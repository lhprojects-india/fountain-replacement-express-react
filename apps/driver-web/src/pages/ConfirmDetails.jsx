import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@lh/shared";
import { Button } from "@lh/shared";
import { Input } from "@lh/shared";
import { useToast } from "@lh/shared";
import { CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useOptionalApplication } from "../context/ApplicationContext";
import { SCREENING_STEP_PATHS } from "../lib/screening-navigation";

const ConfirmDetails = () => {
  const navigate = useNavigate();
  const appContext = useOptionalApplication();
  const { application: authApplication, updateUserData, isLoading } = useAuth();
  const application = appContext?.application || authApplication;
  const isLoadingScreening = appContext ? appContext.isLoadingScreening : isLoading;
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [postcode, setPostcode] = useState("");
  const [country, setCountry] = useState("");
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (application) {
      setFirstName(application.firstName || "");
      setLastName(application.lastName || "");
      setEmail(application.email || "");
      setPhone(application.phone || "");
      setCity(application.city || "");
      setVehicleType(application.vehicleType || "");
      setAddressLine1(application.addressLine1 || "");
      setAddressLine2(application.addressLine2 || "");
      setPostcode(application.postcode || "");
      setCountry(application.country || "");
    }
  }, [application]);

  useEffect(() => {
    setFormErrors((prev) => ({
      ...prev,
      firstName: prev.firstName && !firstName?.trim() ? "First name is required" : "",
      lastName: prev.lastName && !lastName?.trim() ? "Last name is required" : "",
      phone: prev.phone && !phone?.trim() ? "Phone number is required" : "",
      city: prev.city && !city?.trim() ? "City is required" : "",
    }));
  }, [firstName, lastName, phone, city]);

  const handleConfirm = async () => {
    const nextErrors = {
      firstName: !firstName?.trim() ? "First name is required" : "",
      lastName: !lastName?.trim() ? "Last name is required" : "",
      email: !email?.trim() ? "Email is required" : "",
      phone: !phone?.trim() ? "Phone number is required" : "",
      city: !city?.trim() ? "City is required" : "",
    };
    setFormErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      toast({
        title: "Incomplete data",
        description: "Please complete all required fields before continuing.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      if (!appContext) {
        await updateUserData({
          name: `${firstName} ${lastName}`.trim(),
          phone,
          city,
          vehicleType,
          step: "confirm_details",
        });
      } else {
        await appContext.updateProfile({
          firstName,
          lastName,
          phone,
          city,
          vehicleType,
          addressLine1,
          addressLine2,
          postcode,
          country,
        });
      }
      toast({
        title: "Details saved",
        description: "Your profile details were updated.",
      });
      navigate(appContext ? "/screening/vehicle-check" : "/introduction");
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Unable to save your details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <PageLayout
      title="Confirm your details"
      compact
      routes={appContext ? SCREENING_STEP_PATHS : undefined}
      basePath={appContext ? "/screening" : "/"}
    >
      <div className="w-full flex flex-col items-center space-y-6">
        <div className="text-center mb-2">
          <p className="text-sm text-gray-600">
            Review and update your profile details before continuing.
          </p>
        </div>

        <div className="w-full max-w-xs space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-brand-pink">*</span>
            </label>
            <Input
              value={firstName}
              placeholder="First name"
              type="text"
              onChange={(e) => setFirstName(e.target.value)}
            />
            {formErrors.firstName ? <p className="text-xs text-red-600 mt-1">{formErrors.firstName}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-brand-pink">*</span>
            </label>
            <Input
              value={lastName}
              placeholder="Last name"
              type="text"
              onChange={(e) => setLastName(e.target.value)}
            />
            {formErrors.lastName ? <p className="text-xs text-red-600 mt-1">{formErrors.lastName}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-brand-pink">*</span>
            </label>
            <Input
              value={email}
              placeholder="your.email@example.com"
              type="email"
              disabled
              className="bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-brand-pink">*</span>
            </label>
            <Input
              value={phone}
              placeholder="+353 12 345 6789"
              type="tel"
              onChange={(e) => setPhone(e.target.value)}
            />
            {formErrors.phone ? <p className="text-xs text-red-600 mt-1">{formErrors.phone}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City <span className="text-brand-pink">*</span>
            </label>
            <Input value={city} placeholder="Dublin" type="text" onChange={(e) => setCity(e.target.value)} />
            {formErrors.city ? <p className="text-xs text-red-600 mt-1">{formErrors.city}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
            <Input
              value={vehicleType}
              placeholder="e.g., Car, Bike, Van"
              type="text"
              onChange={(e) => setVehicleType(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
            <Input
              value={addressLine1}
              placeholder="Street address"
              type="text"
              onChange={(e) => setAddressLine1(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
            <Input
              value={addressLine2}
              placeholder="Apartment, suite, etc."
              type="text"
              onChange={(e) => setAddressLine2(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
            <Input
              value={postcode}
              placeholder="Postcode"
              type="text"
              onChange={(e) => setPostcode(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <Input
              value={country}
              placeholder="Country"
              type="text"
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full max-w-xs mt-6">
          <Button
            onClick={handleConfirm}
            className="w-full bg-brand-teal hover:bg-brand-shadeTeal"
            disabled={isProcessing || isLoadingScreening}
          >
            <CheckCircle size={18} />
            {isProcessing ? "Processing..." : "Save & Continue"}
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500 max-w-xs mt-4">
          Keep your details up to date so your screening and next pipeline stages proceed without delays.
        </p>
      </div>
    </PageLayout>
  );
};

export default ConfirmDetails;
