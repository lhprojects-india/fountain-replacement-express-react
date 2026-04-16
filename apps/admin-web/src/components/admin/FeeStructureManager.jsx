import { useState, useEffect } from "react";
import { adminServices } from "../../lib/admin-services.js";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { 
  Button, 
  Card, CardContent, CardDescription, CardHeader, CardTitle, 
  Badge,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
  Input,
  Label,
  Textarea,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
  useToast
} from "@lh/shared";
import { useState as useLocalState } from "react";
import { Plus, Edit, Trash2, Save, X, FileText, Search, ChevronRight, Settings2, Truck, Car } from "lucide-react";
import { Skeleton } from "@lh/shared";

// Currency mapping: code -> symbol
const CURRENCY_MAP = {
  'GBP': '£',
  'USD': '$',
  'EUR': '€',
  'SGD': '$'
};

// Reverse mapping: symbol -> code (for backward compatibility)
const SYMBOL_TO_CODE = {
  '£': 'GBP',
  '$': 'USD', // Default to USD for backward compatibility
  '€': 'EUR'
};

// Helper to convert currency code to symbol
const getCurrencySymbol = (code) => {
  return CURRENCY_MAP[code] || code;
};

// Helper to normalize currency (handle both old symbol format and new code format)
const normalizeCurrency = (currency) => {
  // If it's already a symbol, convert to code for internal use
  if (CURRENCY_MAP[currency]) {
    return currency; // Already a code
  }
  return SYMBOL_TO_CODE[currency] || 'GBP'; // Convert symbol to code, default to GBP
};

// Helper to get display currency (always return symbol)
const getDisplayCurrency = (currency) => {
  return getCurrencySymbol(normalizeCurrency(currency));
};

// Helper function to remove trailing '+' from earnings strings
const cleanEarningsString = (earnings) => {
  if (!earnings) return earnings;
  if (typeof earnings === 'string') {
    return earnings.replace(/\+\s*$/, '').trim();
  }
  // If it's an object (for vehicle-specific), return as-is (will be handled per property)
  return earnings;
};

export default function FeeStructureManager() {
  const { toast } = useToast();
  const { adminRole, currentUser } = useAdminAuth();
  const [feeStructures, setFeeStructures] = useState({});
  const [selectedCityId, setSelectedCityId] = useLocalState(null);
  const [citySearch, setCitySearch] = useLocalState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [formData, setFormData] = useState({
    city: '',
    feeType: 'general', // 'general' or 'vehicle-specific'
    currency: 'GBP', // Store as code internally
    blocks: [
      {
        shiftLength: 4,
        minimumFee: 50,
        includedTasks: 12,
        additionalTaskFee: 4.58,
        density: 'high'
      }
    ],
    // For vehicle-specific fees
    vehicleBlocks: {
      van: [],
      car: []
    },
    averageHourlyEarnings: '',
    averagePerTaskEarnings: ''
  });

  useEffect(() => {
    loadFeeStructures();
  }, [currentUser]);

  const loadFeeStructures = async () => {
    setIsLoading(true);
    try {
      const structures = await adminServices.getAllFeeStructures();

      // Filter by accessible cities if restricted
      let finalStructures = structures;
      if (currentUser?.accessibleCities?.length > 0 && adminRole !== 'super_admin') {
        const filtered = {};
        const accessibleCitiesLower = currentUser.accessibleCities.map(c => c.toLowerCase());
        Object.keys(structures).forEach(city => {
          if (accessibleCitiesLower.includes(city.toLowerCase())) {
            filtered[city] = structures[city];
          }
        });
        finalStructures = filtered;
      }
      setFeeStructures(finalStructures);
      setSelectedCityId(prev => prev ?? Object.keys(finalStructures)[0] ?? null);
    } catch (error) {
      toast({
        title: "Error loading fee structures",
        description: "Unable to load fee structures. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setFormData({
      city: '',
      feeType: 'general',
      currency: 'GBP',
      blocks: [
        {
          shiftLength: 4,
          minimumFee: 50,
          includedTasks: 12,
          additionalTaskFee: 4.58,
          density: 'high'
        }
      ],
      vehicleBlocks: {
        van: [],
        car: []
      },
      averageHourlyEarnings: '',
      averagePerTaskEarnings: ''
    });
    setEditingCity(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (cityId, structure) => {
    const feeType = structure.feeType || 'general';

    if (feeType === 'vehicle-specific') {
      // Handle vehicle-specific structure
      setFormData({
        city: structure.city,
        feeType: 'vehicle-specific',
        currency: normalizeCurrency(structure.currency),
        blocks: [], // Not used for vehicle-specific
        vehicleBlocks: {
          van: structure.blocks?.van || [],
          car: structure.blocks?.car || []
        },
        averageHourlyEarnings: structure.averageHourlyEarnings || '',
        averagePerTaskEarnings: structure.averagePerTaskEarnings || ''
      });
    } else {
      // Handle general structure
      setFormData({
        city: structure.city,
        feeType: 'general',
        currency: normalizeCurrency(structure.currency),
        blocks: structure.blocks || [],
        vehicleBlocks: {
          van: [],
          car: []
        },
        averageHourlyEarnings: structure.averageHourlyEarnings || '',
        averagePerTaskEarnings: structure.averagePerTaskEarnings || ''
      });
    }
    setEditingCity(cityId);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.city.trim()) {
        toast({
          title: "Validation error",
          description: "City name is required.",
          variant: "destructive",
        });
        return;
      }

      // Validation based on fee type
      if (formData.feeType === 'vehicle-specific') {
        if (!formData.vehicleBlocks.van || formData.vehicleBlocks.van.length === 0) {
          toast({
            title: "Validation error",
            description: "At least one van fee block is required for vehicle-specific fees.",
            variant: "destructive",
          });
          return;
        }
        if (!formData.vehicleBlocks.car || formData.vehicleBlocks.car.length === 0) {
          toast({
            title: "Validation error",
            description: "At least one car fee block is required for vehicle-specific fees.",
            variant: "destructive",
          });
          return;
        }
      } else {
        if (formData.blocks.length === 0) {
          toast({
            title: "Validation error",
            description: "At least one block is required.",
            variant: "destructive",
          });
          return;
        }
      }

      // Prepare data to save based on fee type
      let dataToSave;
      if (formData.feeType === 'vehicle-specific') {
        // Calculate earnings for each vehicle type
        const vanHourly = calculateAverageHourlyEarnings(formData.vehicleBlocks.van, formData.currency);
        const vanPerTask = calculateAveragePerTaskEarnings(formData.vehicleBlocks.van, formData.currency);
        const carHourly = calculateAverageHourlyEarnings(formData.vehicleBlocks.car, formData.currency);
        const carPerTask = calculateAveragePerTaskEarnings(formData.vehicleBlocks.car, formData.currency);

        dataToSave = {
          city: formData.city,
          feeType: 'vehicle-specific',
          currency: getCurrencySymbol(formData.currency),
          blocks: {
            van: formData.vehicleBlocks.van,
            car: formData.vehicleBlocks.car
          },
          averageHourlyEarnings: {
            van: cleanEarningsString(vanHourly),
            car: cleanEarningsString(carHourly)
          },
          averagePerTaskEarnings: {
            van: cleanEarningsString(vanPerTask),
            car: cleanEarningsString(carPerTask)
          }
        };
      } else {
        // General fee structure
        dataToSave = {
          city: formData.city,
          feeType: 'general',
          currency: getCurrencySymbol(formData.currency),
          blocks: formData.blocks,
          averageHourlyEarnings: cleanEarningsString(formData.averageHourlyEarnings),
          averagePerTaskEarnings: cleanEarningsString(formData.averagePerTaskEarnings)
        };
      }

      const success = await adminServices.setFeeStructure(dataToSave.city, dataToSave);
      if (success) {
        toast({
          title: "Fee structure saved",
          description: `Fee structure for ${formData.city} has been saved successfully.`,
        });
        setIsDialogOpen(false);
        loadFeeStructures();
      } else {
        toast({
          title: "Save failed",
          description: "Unable to save fee structure. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Unable to save fee structure. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (cityId, cityName) => {
    try {
      const success = await adminServices.deleteFeeStructure(cityName);
      if (success) {
        toast({
          title: "Fee structure deleted",
          description: `Fee structure for ${cityName} has been deleted.`,
        });
        loadFeeStructures();
      } else {
        toast({
          title: "Delete failed",
          description: "Unable to delete fee structure. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Unable to delete fee structure. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addBlock = () => {
    setFormData(prev => ({
      ...prev,
      blocks: [...prev.blocks, {
        shiftLength: 4,
        minimumFee: 50,
        includedTasks: 12,
        additionalTaskFee: 4.58,
        density: 'medium'
      }]
    }));
  };

  const removeBlock = (index) => {
    setFormData(prev => ({
      ...prev,
      blocks: prev.blocks.filter((_, i) => i !== index)
    }));
  };

  const updateBlock = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      blocks: prev.blocks.map((block, i) =>
        i === index ? { ...block, [field]: value } : block
      )
    }));
  };

  // Vehicle-specific block helpers
  const addVehicleBlock = (vehicleType) => {
    setFormData(prev => ({
      ...prev,
      vehicleBlocks: {
        ...prev.vehicleBlocks,
        [vehicleType]: [...prev.vehicleBlocks[vehicleType], {
          shiftLength: 4,
          minimumFee: 50,
          includedTasks: 12,
          additionalTaskFee: 4.58,
          density: 'medium'
        }]
      }
    }));
  };

  const removeVehicleBlock = (vehicleType, index) => {
    setFormData(prev => ({
      ...prev,
      vehicleBlocks: {
        ...prev.vehicleBlocks,
        [vehicleType]: prev.vehicleBlocks[vehicleType].filter((_, i) => i !== index)
      }
    }));
  };

  const updateVehicleBlock = (vehicleType, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      vehicleBlocks: {
        ...prev.vehicleBlocks,
        [vehicleType]: prev.vehicleBlocks[vehicleType].map((block, i) =>
          i === index ? { ...block, [field]: value } : block
        )
      }
    }));
  };

  // Calculate average hourly earnings from blocks
  const calculateAverageHourlyEarnings = (blocks, currencyCode) => {
    if (!blocks || blocks.length === 0) return '';

    const currencySymbol = getCurrencySymbol(currencyCode);
    const hourlyRates = blocks.map(block => {
      if (!block.shiftLength || block.shiftLength === 0) return null;
      const baseHourly = block.minimumFee / block.shiftLength;
      // Estimate max hourly with some extra tasks (assume 50% more tasks than included)
      const estimatedExtraTasks = Math.ceil(block.includedTasks * 0.5);
      const maxHourly = (block.minimumFee + (estimatedExtraTasks * block.additionalTaskFee)) / block.shiftLength;
      return { min: baseHourly, max: maxHourly };
    }).filter(Boolean);

    if (hourlyRates.length === 0) return '';

    const minAvg = hourlyRates.reduce((sum, rate) => sum + rate.min, 0) / hourlyRates.length;
    const maxAvg = hourlyRates.reduce((sum, rate) => sum + rate.max, 0) / hourlyRates.length;

    return `${currencySymbol}${minAvg.toFixed(2)}–${currencySymbol}${maxAvg.toFixed(2)}`;
  };

  // Calculate average per task earnings from blocks
  const calculateAveragePerTaskEarnings = (blocks, currencyCode) => {
    if (!blocks || blocks.length === 0) return '';

    const currencySymbol = getCurrencySymbol(currencyCode);
    const taskRates = blocks.map(block => {
      if (!block.includedTasks || block.includedTasks === 0) return null;
      const minPerTask = block.minimumFee / block.includedTasks;
      const maxPerTask = block.additionalTaskFee; // Extra tasks pay this rate
      return { min: minPerTask, max: maxPerTask };
    }).filter(Boolean);

    if (taskRates.length === 0) return '';

    const minAvg = taskRates.reduce((sum, rate) => sum + rate.min, 0) / taskRates.length;
    const maxAvg = taskRates.reduce((sum, rate) => sum + rate.max, 0) / taskRates.length;

    return `${currencySymbol}${minAvg.toFixed(2)}–${currencySymbol}${maxAvg.toFixed(2)}`;
  };

  // Auto-calculate earnings when blocks or currency change
  useEffect(() => {
    if (formData.feeType === 'vehicle-specific') {
      // For vehicle-specific, we calculate on save, not here
      // This effect is mainly for general fees
      return;
    }

    if (formData.blocks && formData.blocks.length > 0) {
      const calculatedHourly = calculateAverageHourlyEarnings(formData.blocks, formData.currency);
      const calculatedPerTask = calculateAveragePerTaskEarnings(formData.blocks, formData.currency);

      // Only update if values have changed to avoid unnecessary re-renders
      setFormData(prev => {
        if (prev.averageHourlyEarnings === calculatedHourly &&
          prev.averagePerTaskEarnings === calculatedPerTask) {
          return prev; // No change needed
        }
        return {
          ...prev,
          averageHourlyEarnings: calculatedHourly,
          averagePerTaskEarnings: calculatedPerTask
        };
      });
    } else {
      // Clear earnings if no blocks
      setFormData(prev => ({
        ...prev,
        averageHourlyEarnings: '',
        averagePerTaskEarnings: ''
      }));
    }
  }, [formData.blocks, formData.currency, formData.feeType]);

  const citiesInView = Object.keys(feeStructures)
    .filter(c => c.toLowerCase().includes(citySearch.toLowerCase()))
    .sort();

  const activeCity = selectedCityId && feeStructures[selectedCityId]
    ? selectedCityId
    : citiesInView[0] ?? null;
  const activeStructure = activeCity ? feeStructures[activeCity] : null;
  const sym = activeStructure ? getDisplayCurrency(activeStructure.currency) : '£';

  const densityDot = (density) => {
    const colors = { high: '#0890F1', medium: '#FFD06D', low: '#EF8EA2' };
    return <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: colors[density] || '#94a3b8' }} />;
  };

  if (isLoading) {
    return (
      <div className="flex h-[600px] rounded-xl overflow-hidden border border-slate-200 bg-white">
        <div className="w-60 border-r p-4 space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-full rounded-lg" />
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
        <div className="flex-1 p-8 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-white" style={{ minHeight: '600px' }}>
      {/* ── Left sidebar ── */}
      <div className="w-60 shrink-0 border-r border-slate-100 flex flex-col" style={{ background: '#f8fafc' }}>
        <div className="px-4 pt-5 pb-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Service Cities</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search cities..."
              value={citySearch}
              onChange={e => setCitySearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {citiesInView.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">No cities found</p>
          )}
          {citiesInView.map(cityId => {
            const s = feeStructures[cityId];
            const isActive = cityId === activeCity;
            return (
              <button
                key={cityId}
                onClick={() => setSelectedCityId(cityId)}
                className="w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-colors"
                style={{
                  background: isActive ? '#e8f0fe' : 'transparent',
                  color: isActive ? '#1d4ed8' : '#374151',
                }}
              >
                <div>
                  <p className="text-sm font-semibold">{s.city || cityId}</p>
                  <p className="text-[11px]" style={{ color: isActive ? '#3b82f6' : '#94a3b8' }}>
                    {s.feeType === 'vehicle-specific' ? 'Vehicle-Specific' : 'General'} · {getDisplayCurrency(s.currency)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0" style={{ opacity: isActive ? 1 : 0.3 }} />
              </button>
            );
          })}
        </div>

        {(adminRole === 'super_admin' || adminRole === 'app_admin') && (
          <div className="p-3 border-t border-slate-100">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateNew} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm">
                  <Plus className="h-4 w-4 mr-1" /> Add City
                </Button>
              </DialogTrigger>
                <DialogContent className="adm-modal max-w-4xl max-h-[90vh] overflow-y-auto z-[200]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCity ? 'Edit Fee Structure' : 'Create New Fee Structure'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingCity ? 'Update the fee structure for this city' : 'Create a new fee structure for a city'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City Name</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="e.g., Birmingham"
                        />
                      </div>
                      <div className="relative z-[150]">
                        <Label htmlFor="currency">Currency</Label>
                        <Select
                          value={formData.currency}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent className="z-[250] bg-white">
                            <SelectItem value="GBP">£ (GBP)</SelectItem>
                            <SelectItem value="USD">$ (USD)</SelectItem>
                            <SelectItem value="EUR">€ (EUR)</SelectItem>
                            <SelectItem value="SGD">$ (SGD)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Fee Type Selector */}
                    <div className="relative z-[150]">
                      <Label htmlFor="feeType">Fee Type</Label>
                      <Select
                        value={formData.feeType}
                        onValueChange={(value) => {
                          setFormData(prev => ({
                            ...prev,
                            feeType: value,
                            // Reset blocks when switching types
                            blocks: value === 'general' ? (prev.blocks.length > 0 ? prev.blocks : [{
                              shiftLength: 4,
                              minimumFee: 50,
                              includedTasks: 12,
                              additionalTaskFee: 4.58,
                              density: 'high'
                            }]) : [],
                            vehicleBlocks: value === 'vehicle-specific' ? (prev.vehicleBlocks.van.length > 0 || prev.vehicleBlocks.car.length > 0 ? prev.vehicleBlocks : {
                              van: [],
                              car: []
                            }) : { van: [], car: [] }
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select fee type" />
                        </SelectTrigger>
                        <SelectContent className="z-[250] bg-white">
                          <SelectItem value="general">General Fee</SelectItem>
                          <SelectItem value="vehicle-specific">Vehicle-Specific Fee (Van & Car)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.feeType === 'vehicle-specific'
                          ? 'Vehicle-specific fees require both van and car fee blocks to be set.'
                          : 'General fee applies to all vehicle types.'}
                      </p>
                    </div>

                    {/* General Fee Blocks */}
                    {formData.feeType === 'general' && (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <Label>Fee Blocks</Label>
                          <Button variant="outline" size="sm" onClick={addBlock}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Block
                          </Button>
                        </div>

                        <div className="space-y-4">
                          {formData.blocks.map((block, index) => (
                            <Card key={index}>
                              <CardHeader className="pb-3">
                                <div className="flex justify-between items-center">
                                  <CardTitle className="text-lg">Block {index + 1}</CardTitle>
                                  {formData.blocks.length > 1 && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeBlock(index)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                  <div className="relative z-[150]">
                                    <Label>Density</Label>
                                    <Select
                                      value={block.density}
                                      onValueChange={(value) => updateBlock(index, 'density', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="z-[250] bg-white">
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Shift Length (hours)</Label>
                                    <Input
                                      type="number"
                                      value={block.shiftLength}
                                      onChange={(e) => updateBlock(index, 'shiftLength', parseInt(e.target.value))}
                                    />
                                  </div>
                                  <div>
                                    <Label>Minimum Fee</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={block.minimumFee}
                                      onChange={(e) => updateBlock(index, 'minimumFee', parseFloat(e.target.value))}
                                    />
                                  </div>
                                  <div>
                                    <Label>Included Tasks</Label>
                                    <Input
                                      type="number"
                                      value={block.includedTasks}
                                      onChange={(e) => updateBlock(index, 'includedTasks', parseInt(e.target.value))}
                                    />
                                  </div>
                                  <div>
                                    <Label>Additional Task Fee</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={block.additionalTaskFee}
                                      onChange={(e) => updateBlock(index, 'additionalTaskFee', parseFloat(e.target.value))}
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Vehicle-Specific Fee Blocks */}
                    {formData.feeType === 'vehicle-specific' && (
                      <div className="space-y-6">
                        {/* Van Fees */}
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <Label className="text-lg font-semibold">Van Fees</Label>
                            <Button variant="outline" size="sm" onClick={() => addVehicleBlock('van')}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Van Block
                            </Button>
                          </div>
                          <div className="space-y-4">
                            {formData.vehicleBlocks.van.map((block, index) => (
                              <Card key={index}>
                                <CardHeader className="pb-3">
                                  <div className="flex justify-between items-center">
                                    <CardTitle className="text-lg">Van Block {index + 1}</CardTitle>
                                    {formData.vehicleBlocks.van.length > 1 && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeVehicleBlock('van', index)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="relative z-[150]">
                                      <Label>Density</Label>
                                      <Select
                                        value={block.density}
                                        onValueChange={(value) => updateVehicleBlock('van', index, 'density', value)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="z-[250] bg-white">
                                          <SelectItem value="high">High</SelectItem>
                                          <SelectItem value="medium">Medium</SelectItem>
                                          <SelectItem value="low">Low</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label>Shift Length (hours)</Label>
                                      <Input
                                        type="number"
                                        value={block.shiftLength}
                                        onChange={(e) => updateVehicleBlock('van', index, 'shiftLength', parseInt(e.target.value))}
                                      />
                                    </div>
                                    <div>
                                      <Label>Minimum Fee</Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={block.minimumFee}
                                        onChange={(e) => updateVehicleBlock('van', index, 'minimumFee', parseFloat(e.target.value))}
                                      />
                                    </div>
                                    <div>
                                      <Label>Included Tasks</Label>
                                      <Input
                                        type="number"
                                        value={block.includedTasks}
                                        onChange={(e) => updateVehicleBlock('van', index, 'includedTasks', parseInt(e.target.value))}
                                      />
                                    </div>
                                    <div>
                                      <Label>Additional Task Fee</Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={block.additionalTaskFee}
                                        onChange={(e) => updateVehicleBlock('van', index, 'additionalTaskFee', parseFloat(e.target.value))}
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                            {formData.vehicleBlocks.van.length === 0 && (
                              <p className="text-sm text-gray-500 text-center py-4">No van blocks added yet. Click "Add Van Block" to get started.</p>
                            )}
                          </div>
                        </div>

                        {/* Car Fees */}
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <Label className="text-lg font-semibold">Car Fees</Label>
                            <Button variant="outline" size="sm" onClick={() => addVehicleBlock('car')}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Car Block
                            </Button>
                          </div>
                          <div className="space-y-4">
                            {formData.vehicleBlocks.car.map((block, index) => (
                              <Card key={index}>
                                <CardHeader className="pb-3">
                                  <div className="flex justify-between items-center">
                                    <CardTitle className="text-lg">Car Block {index + 1}</CardTitle>
                                    {formData.vehicleBlocks.car.length > 1 && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeVehicleBlock('car', index)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="relative z-[150]">
                                      <Label>Density</Label>
                                      <Select
                                        value={block.density}
                                        onValueChange={(value) => updateVehicleBlock('car', index, 'density', value)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="z-[250] bg-white">
                                          <SelectItem value="high">High</SelectItem>
                                          <SelectItem value="medium">Medium</SelectItem>
                                          <SelectItem value="low">Low</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label>Shift Length (hours)</Label>
                                      <Input
                                        type="number"
                                        value={block.shiftLength}
                                        onChange={(e) => updateVehicleBlock('car', index, 'shiftLength', parseInt(e.target.value))}
                                      />
                                    </div>
                                    <div>
                                      <Label>Minimum Fee</Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={block.minimumFee}
                                        onChange={(e) => updateVehicleBlock('car', index, 'minimumFee', parseFloat(e.target.value))}
                                      />
                                    </div>
                                    <div>
                                      <Label>Included Tasks</Label>
                                      <Input
                                        type="number"
                                        value={block.includedTasks}
                                        onChange={(e) => updateVehicleBlock('car', index, 'includedTasks', parseInt(e.target.value))}
                                      />
                                    </div>
                                    <div>
                                      <Label>Additional Task Fee</Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={block.additionalTaskFee}
                                        onChange={(e) => updateVehicleBlock('car', index, 'additionalTaskFee', parseFloat(e.target.value))}
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                            {formData.vehicleBlocks.car.length === 0 && (
                              <p className="text-sm text-gray-500 text-center py-4">No car blocks added yet. Click "Add Car Block" to get started.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Calculated Earnings Information */}
                    {formData.feeType === 'general' && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <Label htmlFor="hourlyEarnings">Average Hourly Earnings</Label>
                          <Input
                            id="hourlyEarnings"
                            value={formData.averageHourlyEarnings}
                            readOnly
                            className="bg-gray-50 cursor-not-allowed"
                            placeholder="Calculated from blocks..."
                          />
                          <p className="text-xs text-gray-500 mt-1">Automatically calculated from block details</p>
                        </div>
                        <div>
                          <Label htmlFor="taskEarnings">Average Per Task Earnings</Label>
                          <Input
                            id="taskEarnings"
                            value={formData.averagePerTaskEarnings}
                            readOnly
                            className="bg-gray-50 cursor-not-allowed"
                            placeholder="Calculated from blocks..."
                          />
                          <p className="text-xs text-gray-500 mt-1">Automatically calculated from block details</p>
                        </div>
                      </div>
                    )}
                    {formData.feeType === 'vehicle-specific' && (
                      <div className="pt-4 border-t">
                        <p className="text-sm text-gray-600 mb-2">Earnings will be calculated automatically for each vehicle type when you save.</p>
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="h-4 w-4 mr-2" />
                      {editingCity ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 overflow-y-auto">
        {!activeCity || !activeStructure ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No fee structures yet</p>
            <p className="text-sm text-slate-400 mt-1">Add a city using the button on the left.</p>
          </div>
        ) : (
          <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded text-blue-700 bg-blue-50 border border-blue-100">
                    Configuration Mode
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mt-2">
                  <span className="text-slate-900">{activeStructure.city}</span>{' '}
                  <span className="font-normal text-slate-400">Fee Structure</span>
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  {activeStructure.feeType === 'vehicle-specific' ? 'Vehicle-Specific · ' : 'General · '}
                  Currency: {sym}
                  {activeStructure.feeType !== 'vehicle-specific' && activeStructure.averageHourlyEarnings && (
                    <> · Avg hourly: <strong>{cleanEarningsString(activeStructure.averageHourlyEarnings)}</strong></>
                  )}
                </p>
              </div>
              {(adminRole === 'super_admin' || adminRole === 'app_admin') && (
                <div className="flex items-center gap-2 shrink-0">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-rose-600 border-rose-200 hover:bg-rose-50">
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Fee Structure</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the fee structure for {activeStructure.city}? This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(activeCity, activeStructure.city)} className="bg-rose-600 hover:bg-rose-700">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button
                    onClick={() => handleEdit(activeCity, activeStructure)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Edit className="h-4 w-4 mr-2" /> Edit Fee Structure
                  </Button>
                </div>
              )}
            </div>

            {/* ── General fee blocks table ── */}
            {activeStructure.feeType !== 'vehicle-specific' && (
              <FeeBlocksSection
                title="General Settings"
                icon={<Settings2 className="h-5 w-5 text-blue-600" />}
                blocks={activeStructure.blocks || []}
                currency={sym}
                densityDot={densityDot}
              />
            )}

            {/* ── Vehicle-specific: Van ── */}
            {activeStructure.feeType === 'vehicle-specific' && (
              <>
                <FeeBlocksSection
                  title="Vehicle-Specific: Large Van"
                  subtitle="Applied to Transit &amp; Boxer models"
                  icon={<Truck className="h-5 w-5 text-blue-600" />}
                  blocks={activeStructure.blocks?.van || []}
                  currency={sym}
                  densityDot={densityDot}
                />
                <FeeBlocksSection
                  title="Vehicle-Specific: Compact Car"
                  subtitle="Applied to Hatchback &amp; Estate models"
                  icon={<Car className="h-5 w-5 text-blue-600" />}
                  blocks={activeStructure.blocks?.car || []}
                  currency={sym}
                  densityDot={densityDot}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Reusable table section ── */
function FeeBlocksSection({ title, subtitle, icon, blocks, currency, densityDot }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{title}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>

      {/* Table */}
      {blocks.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400 bg-white">
          No blocks configured for this section.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Density Level</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Shift Length</th>
                <th className="text-right px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Min Fee ({currency})</th>
                <th className="text-right px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Included Tasks</th>
                <th className="text-right px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Add&apos;l Task ({currency})</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {blocks.map((block, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-700 capitalize">
                    {densityDot(block.density)}
                    {block.density} ({block.density === 'high' ? '1.2+' : block.density === 'medium' ? '0.8–1.2' : '0.5–0.8'})
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {block.shiftLength}h shift
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-slate-800">
                    {currency}{Number(block.minimumFee).toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5 text-right text-slate-600">
                    {block.includedTasks}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold" style={{ color: '#0890F1' }}>
                    +{currency}{Number(block.additionalTaskFee).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
