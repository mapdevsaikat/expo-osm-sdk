import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { DEFAULT_CITIES, type City } from '../../constants';
import { citiesTabStyles } from '../../styles/tabs';

interface CitiesTabProps {
  onCityPress: (city: City) => void;
}

export const CitiesTab: React.FC<CitiesTabProps> = ({ onCityPress }) => {
  return (
    <View style={citiesTabStyles.tabContent}>
      <Text style={citiesTabStyles.sectionTitle}>🇮🇳 Indian Cities</Text>
      
      <View style={citiesTabStyles.cityGrid}>
        {DEFAULT_CITIES.map((city) => (
          <TouchableOpacity
            key={city.name}
            style={citiesTabStyles.cityButton}
            onPress={() => onCityPress(city)}
          >
            <Text style={citiesTabStyles.cityEmoji}>{city.emoji}</Text>
            <Text style={citiesTabStyles.cityName}>{city.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={citiesTabStyles.infoBox}>
        <Text style={citiesTabStyles.infoText}>💡 Tap any city to fly there</Text>
        <Text style={citiesTabStyles.infoText}>🗺️ Explore major Indian cities</Text>
        <Text style={citiesTabStyles.infoText}>🛡️ Secured navigation system</Text>
      </View>
    </View>
  );
};

