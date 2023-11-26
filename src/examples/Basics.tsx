import * as z from "zod";
import { useState } from "react";
import AutoForm, { AutoFormSubmit } from "../components/ui/auto-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";

// Define the structure of each appliance
interface Appliance {
  appliance: keyof typeof appliances; // Assuming 'appliances' is an object with keys being the appliance names
  hours: "0-2" | "2-4" | "4-6" | "6-8" | "8-16" | "16-24";
}

// Define the structure of a room
interface Room {
  name: string;
  Appliances: Appliance[];
}

// Define the structure for the form values that includes rooms
interface ArrayFormValues {
  rooms: Room[];
}

// read API_URL from environment variables
const API_URL = import.meta.env.VITE_API_URL

const basicFormSchema = z.object({
  
  people: z.coerce
    .number({
      invalid_type_error: "Kindly enter a number.",
    })
    .min(0, {
      message: "Please enter a positive number",
    })
    .describe("How many people live in your house?"),

  size: z.coerce.number().describe("What is the size of your house?"),

  unit: z.enum(["sqft", "gaz", "marla"]).describe("Unit of size"),

  octBill: z.coerce
    .number({
      invalid_type_error: "Kindly enter a number.",
    })
    .min(0, {
      message: "Please enter a positive number",
    })
    .max(2000, {
      message: "Please enter a number less than 2000",
    })
    .describe("How many units of electricity did you consume in October?"),
  sepBill: z.coerce
    .number({
      invalid_type_error: "Kindly enter a number.",
    })
    .min(0, {
      message: "Please enter a positive number",
    })
    .max(2000, {
      message: "Please enter a number less than 2000",
    })
    .describe("How many units of electricity did you consume in September?"),
  augBill: z.coerce
    .number({
      invalid_type_error: "Kindly enter a number.",
    })
    .min(0, {
      message: "Please enter a positive number",
    })
    .max(2000, {
      message: "Please enter a number less than 2000",
    })
    .describe("How many units of electricity did you consume in August?"),

});

const appliances = {
  'Air Conditioner (Inverter)': 'Air Conditioner (Inverter)',
  'Air Conditioner (Non-Inverter)': 'Air Conditioner (Non-Inverter)',
  'Refrigerator': 'Refrigerator',
  'Washing Machine': 'Washing Machine',
  'Water Dispenser': 'Water Dispenser',
  'Deep Freezer': 'Deep Freezer',
  'Electric Oven': 'Electric Oven',
  'Microwave Oven': 'Microwave Oven',
  'Electric Kettle': 'Electric Kettle',
  'Television': 'Television',
  'Desktop Computer': 'Desktop Computer',
  'Gaming Consoles/Laptops': 'Gaming Consoles/Laptops',
  'Water heater/Electric Geyser': 'Water heater/Electric Geyser',
  'Iron': 'Iron',
  'Electric Stove': 'Electric Stove',
};

const arrayFormSchema = z.object({
  rooms: z
    .array(
      z.object({
        name: z.string(),
        Appliances: z.array(
          z.object({
            appliance: z.nativeEnum(appliances),
            hours: z
              .enum(["0-2", "2-4", "4-6", "6-8", "8-16", "16-24"])
              .describe("Daily Usage in Hours"),
          }),
        ),
      }),
    )
    .nonempty({ message: "Please add at least one room"})
    .describe("Rooms in your house"),
    fans: z
    .coerce.number({
      invalid_type_error: "Kindly enter a number.",
    })
    .min(0, {
      message: "Please enter a positive number",
    })
    .describe("How many fans do you have in your house?"),
  lights: z
    .coerce.number({
      invalid_type_error: "Kindly enter a number.",
    })
    .min(0, {
      message: "Please enter a positive number",
    })
    .describe("How many lights do you have in your house?"),
})

function PredictionResult({ predictionResult }: { predictionResult: string }) {
  return (
    <>
      <CardDescription>
        The predicted units of electricity for the next month are:
      </CardDescription>
      <p>{predictionResult}</p>
    </>
  );
}

function CombinedForm() {
  const [step, setStep] = useState(1);
  const [basicFormValues, setBasicFormValues] = useState({});
  const [arrayFormValues, setArrayFormValues] = useState<ArrayFormValues>({ rooms: [] });
  const [predictionResult, setPredictionResult] = useState<string | null>(null);
  const [roomCount, setRoomCount] = useState(0);

  const handleAddRoom = () => {
    setRoomCount((currentCount) => {
      const newRoomNumber = currentCount + 1;
      const newRoomName = `Room ${newRoomNumber}`;
      const newRoom: Room = {
        name: newRoomName,
        Appliances: []
      };

      setArrayFormValues(currentValues => ({
        ...currentValues,
        rooms: [...currentValues.rooms, newRoom]
      }));

      return newRoomNumber;
    });
  };

  const handleSubmit = async () => {
    const combinedFormValues = { ...basicFormValues, ...arrayFormValues };
    console.log("Combined Form Values:", combinedFormValues);

    try {
      const response = await fetch(API_URL + "/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(combinedFormValues),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setPredictionResult(data.predictedUnits);
      setStep(3);
    } catch (error) {
      console.error("There was an error:", error);
    }
  };

  return (
    <div className="mx-auto my-6 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-3xl font-semibold leading-none tracking-tight">Bill-E</h1>
            <p className="text-xl text-gray-600 text-muted-foreground" style={{ fontWeight: "normal" }}>Electricity Consumption Prediction</p>
            <hr className="my-4" />
          </CardTitle>
          <CardDescription>
            {step === 1
              ? <div>
                <p>Bill-E is designed to empower users with the ability to monitor their electricity consumption by entering relevant usage data. </p> 
                <p style={{ color: "red" }}>*Rest assured that all the information you provide will remain completely anonymous and will not be disclosed to any third-party organizations. Your privacy is our top priority. </p>
                </div>
              : step === 2
                ? <p style={{ color: "red" }}>*Kindly add the information for all the individual rooms in your house to proceed.</p>
              : ""}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 3 && predictionResult && (
            <PredictionResult predictionResult={predictionResult} />
          )}

          {step === 1 && (
            <AutoForm
              formSchema={basicFormSchema}
              values={basicFormValues}
              onValuesChange={setBasicFormValues}
              onSubmit={() => setStep(2)}
              fieldConfig={{
                unit: {
                  fieldType: "radio",
                },
              }}
            >
              <AutoFormSubmit>Next</AutoFormSubmit>
            </AutoForm>
          )}

          {step === 2 && (
            <AutoForm
              formSchema={arrayFormSchema}
              values={arrayFormValues}
              onValuesChange={setArrayFormValues}
              onSubmit={handleSubmit}
              fieldConfig={{
                rooms: {
                  hours: {
                    fieldType: "radio",
                  },
                },
              }}
            >
              <AutoFormSubmit>Submit</AutoFormSubmit>
            </AutoForm>
          )}

          {step === 2 && (
            <Button onClick={() => setStep(1)} className="mt-4">
              Back
            </Button>
          )}

          {/* {step !== 3 && (
            <Json
              data={
                step === 1 ? basicFormValues : { ...basicFormValues, ...arrayFormValues }
              }
              className="mt-6"
            />
          )} */}
        </CardContent>
      </Card>
    </div>
  );
}

export default CombinedForm;
