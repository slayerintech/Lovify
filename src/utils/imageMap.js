const localImages = {
  1: require('../../assets/img1.jpeg'),
  2: require('../../assets/img2.jpeg'),
  3: require('../../assets/img3.jpeg'),
  4: require('../../assets/img4.jpeg'),
  5: require('../../assets/img5.jpeg'),
  6: require('../../assets/img6.jpeg'),
  7: require('../../assets/img7.jpeg'),
  8: require('../../assets/img8.jpeg'),
  9: require('../../assets/img9.jpeg'),
  10: require('../../assets/img10.jpeg'),
  11: require('../../assets/img11.jpeg'),
  12: require('../../assets/img12.jpeg'),
  13: require('../../assets/img13.jpeg'),
  14: require('../../assets/img14.jpeg'),
  15: require('../../assets/img15.jpeg'),
  16: require('../../assets/img16.jpeg'),
  17: require('../../assets/img17.jpeg'),
  18: require('../../assets/img18.jpeg'),
  19: require('../../assets/img19.jpeg'),
  20: require('../../assets/img20.jpeg'),
  21: require('../../assets/img21.jpeg'),
  22: require('../../assets/img22.jpeg'),
  23: require('../../assets/img23.jpeg'),
  24: require('../../assets/img24.jpeg'),
};

export const getLocalImage = (id) => {
  // Check if id is string "dummy_X"
  if (typeof id === 'string' && id.startsWith('dummy_')) {
    const num = id.split('_')[1];
    return localImages[num];
  }
  return null;
};

export default localImages;
