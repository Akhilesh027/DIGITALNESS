import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons";

import DashboardScreen from "../screens/DashboardScreen";
import WorksScreen from "../screens/WorksScreen";
import TeamScreen from "../screens/TeamScreen.js";
import PaymentsScreen from "../screens/PaymentsScreen.js";
import ProfileScreen from "../screens/ProfileScreen";
import AttachmentsScreen from "../screens/AttachmentsScreen";
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,

        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Overview") {
            iconName = focused ? "grid" : "grid-outline";
          } else if (route.name === "Works") {
            iconName = focused ? "briefcase" : "briefcase-outline";
          } else if (route.name === "Team") {
            iconName = focused ? "people" : "people-outline";
          } else if (route.name === "Payments") {
            iconName = focused ? "card" : "card-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }
          else if (route.name === "Attachments") {
  iconName = focused ? "attach" : "attach-outline";
}

          return <Icon name={iconName} size={22} color={color} />;
        },

        tabBarActiveTintColor: "#FBBF24",
        tabBarInactiveTintColor: "#94A3B8",

        tabBarStyle: {
          position: "absolute",
          bottom: 14,
          left: 14,
          right: 14,
          height: 72,
          borderRadius: 24,
          backgroundColor: "#111827",
          borderTopWidth: 0,
          elevation: 10,
          paddingBottom: 8,
          paddingTop: 8,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "800",
          marginTop: 2,
        },

        headerStyle: {
          backgroundColor: "#111827",
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },

        headerTintColor: "#FFFFFF",

        headerTitleStyle: {
          fontWeight: "900",
          fontSize: 18,
        },

        sceneContainerStyle: {
          backgroundColor: "#F8FAFC",
        },
      })}
    >
      <Tab.Screen
        name="Overview"
        component={DashboardScreen}
        options={{
          headerTitle: "Digitalness Portal",
        }}
      />

      <Tab.Screen
        name="Works"
        component={WorksScreen}
        options={{
          headerTitle: "My Works",
        }}
      />

      <Tab.Screen
        name="Team"
        component={TeamScreen}
        options={{
          headerTitle: "Assigned Team",
        }}
      />
<Tab.Screen
  name="Attachments"
  component={AttachmentsScreen}
  options={{
    headerTitle: "Project Attachments",
  }}
/>
      <Tab.Screen
        name="Payments"
        component={PaymentsScreen}
        options={{
          headerTitle: "Invoices & Payments",
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerTitle: "Client Profile",
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;