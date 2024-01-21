export function xAgoDate(days) {
  const t = new Date();
  const xAgoDate = new Date(t.setDate(t.getDate() - days)).toJSON();
  return xAgoDate;
}

const today = xAgoDate(0);
const yesterday = xAgoDate(1);
const twoDaysAgo = xAgoDate(2);

export const terms = [
  { uid: "0012bc7dc3968737a80c83248f63d3b1" },
  { uid: "00e6781c76052848bdaa6b1b0496ff8e" },
  { uid: "0023e81f458ea75aaa9a89031105bf63" },
  { uid: "003e992bdd7aae7c15c646a444fae08d" },
  { uid: "00b29c945e41cc7e9284873f94e3a14d" },
  { uid: "00b32d657e191efb3866ebf080dc3c2a" },
  { uid: "00c102a7e10b45b19afbab71c030bf63" },
  { uid: "02fd75474e4cc84574b1ad8b3211edbb" },
  { uid: "0332d7f79143b03a4b9497100beafb92" },
  { uid: "036265f163ca6f25f5a611a33ac3d98f" },
];

// not yet played
export const mockNotPlayed = {
  one: { vC: 1, lastView: today },
  two: { vC: 1, lastView: today },
};

// pending review
export const mockPending = {
  excluded: {
    one: {
      vC: 2,
      lastView: today,
      lastReview: twoDaysAgo,
      difficultyP: 90,
      accuracyP: 67,
      daysBetweenReviews: 1,
      consecutiveRight: 1,
    },
  },

  pass: {
    one: {
      vC: 2,
      lastView: twoDaysAgo,
      lastReview: twoDaysAgo,
      difficultyP: 90,
      accuracyP: 67,
      daysBetweenReviews: 1,
      consecutiveRight: 1,
    },
    two: {
      vC: 2,
      lastView: xAgoDate(6),
      lastReview: xAgoDate(6),
      difficultyP: 90,
      accuracyP: 71,
      daysBetweenReviews: 1,
      consecutiveRight: 1,
    },
    three: {
      vC: 2,
      lastView: xAgoDate(4),
      lastReview: xAgoDate(4),
      difficultyP: 20,
      accuracyP: 100,
      daysBetweenReviews: 1,
      consecutiveRight: 0,
    },
    four: {
      vC: 2,
      lastView: xAgoDate(5),
      lastReview: xAgoDate(5),
      difficultyP: 30,
      accuracyP: 100,
      daysBetweenReviews: 1,
      consecutiveRight: 0,
    },
    five: {
      vC: 2,
      lastView: yesterday,
      lastReview: twoDaysAgo,
      difficultyP: 90,
      accuracyP: 73,
      daysBetweenReviews: 1,
      consecutiveRight: 1,
    },
    six: {
      vC: 2,
      lastView: twoDaysAgo,
      lastReview: twoDaysAgo,
      difficultyP: 90,
      accuracyP: 75,
      daysBetweenReviews: 0.25,
      consecutiveRight: 0,
    },
  },

  fail: {
    one: {
      vC: 2,
      lastView: twoDaysAgo,
      lastReview: twoDaysAgo,
      difficultyP: 20,
      accuracyP: 31,
      daysBetweenReviews: 1,
      consecutiveRight: 0,
    },
    two: {
      vC: 2,
      lastView: yesterday,
      lastReview: twoDaysAgo,
      difficultyP: 30,
      accuracyP: 23,
      daysBetweenReviews: 1,
      consecutiveRight: 0,
    },
    three: {
      vC: 2,
      lastView: twoDaysAgo,
      lastReview: twoDaysAgo,
      difficultyP: 90,
      accuracyP: 17,
      daysBetweenReviews: 0.25,
      consecutiveRight: 0,
    },
    four: {
      vC: 2,
      lastView: twoDaysAgo,
      lastReview: twoDaysAgo,
      difficultyP: 90,
      accuracyP: 19,
      daysBetweenReviews: 1,
      consecutiveRight: 1,
    },
  },
};

export const mockNotPending = {
  one: {
    vC: 2,
    lastView: xAgoDate(2),
    lastReview: xAgoDate(2),
    difficultyP: 90,
    accuracyP: 67,
    daysBetweenReviews: 3,
    consecutiveRight: 1,
  },
};
