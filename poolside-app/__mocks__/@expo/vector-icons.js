// Mock for @expo/vector-icons
const React = require('react');
const { Text } = require('react-native');

const createIconMock = (name) => {
  const IconComponent = (props) => React.createElement(Text, props, props.name || name);
  IconComponent.displayName = name;
  return IconComponent;
};

module.exports = {
  Ionicons: createIconMock('Ionicons'),
  MaterialIcons: createIconMock('MaterialIcons'),
  FontAwesome: createIconMock('FontAwesome'),
  Feather: createIconMock('Feather'),
  AntDesign: createIconMock('AntDesign'),
  Entypo: createIconMock('Entypo'),
  EvilIcons: createIconMock('EvilIcons'),
  Foundation: createIconMock('Foundation'),
  MaterialCommunityIcons: createIconMock('MaterialCommunityIcons'),
  Octicons: createIconMock('Octicons'),
  SimpleLineIcons: createIconMock('SimpleLineIcons'),
  Zocial: createIconMock('Zocial'),
};
