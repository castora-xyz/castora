// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {OwnableUpgradeable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import {Initializable} from '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import {ReentrancyGuardUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol';
import {UUPSUpgradeable} from '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import {CastoraErrors} from './CastoraErrors.sol';
import {CastoraEvents} from './CastoraEvents.sol';
import {CastoraStructs} from './CastoraStructs.sol';
import {console} from 'forge-std/console.sol';

/// Tracks and logs all user activities across the Castora ecosystem in chronological order.
/// Provides unified activity history for predictions, pool creation, completions, and claims.
/// Maintains engagement metrics and cross-contract activity correlation.
contract CastoraActivities is
  CastoraErrors,
  CastoraEvents,
  CastoraStructs,
  Initializable,
  OwnableUpgradeable,
  UUPSUpgradeable,
  ReentrancyGuardUpgradeable
{
  /// Total number of activities logged
  uint256 public noOfActivities;
  /// Global array of all activities in chronological order
  CastoraActivity[] public globalActivities;
  /// Count of activities by type
  mapping(ActivityType => uint256) public noOfActivitiesByType;
  /// Activity IDs by type
  mapping(ActivityType => uint256[]) public activityIdsByType;
  /// Mapping of user addresses to their activity IDs
  mapping(address => uint256) public userActivityIdsCount;
  /// Mapping of user addresses to their activity IDs
  mapping(address => uint256[]) public userActivityIds;
  /// Count of activities per user per type
  mapping(address => mapping(ActivityType => uint256)) public userActivityIdsCountByType;
  /// User activity IDs organized by activity type
  mapping(address => mapping(ActivityType => uint256[])) public userActivityIdsByType;
  /// Authorized contracts that can log activities
  mapping(address => bool) public isAuthorizedLogger;
  /// User engagement tracking - first activity time
  mapping(address => uint256) public userFirstActivityTime;
  /// User engagement tracking - last activity time
  mapping(address => uint256) public userLastActivityTime;
  /// User engagement tracking - first activity ID
  mapping(address => uint256) public userFirstActivityId;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /// Initializes the contract
  function initialize() public initializer {
    __Ownable_init(msg.sender);
    __UUPSUpgradeable_init();
    __ReentrancyGuard_init();
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

  /// Internal function to update user activity times
  /// @param user Address of the user
  /// @param activityId ID of the current activity
  function _updateUserActivityTimes(address user, uint256 activityId) internal {
    if (userFirstActivityTime[user] == 0) {
      userFirstActivityTime[user] = block.timestamp;
      userFirstActivityId[user] = activityId;
    }
    userLastActivityTime[user] = block.timestamp;
  }

  /// Internal helper to paginate activity arrays
  /// @param activityIds Array of activity IDs to paginate
  /// @param total Total number of items in the array
  /// @param offset Starting index
  /// @param limit Maximum items to return
  /// @return paginatedActivityIds The paginated activityIds
  function _paginateActivityIds(uint256[] storage activityIds, uint256 total, uint256 offset, uint256 limit)
    internal
    view
    returns (uint256[] memory paginatedActivityIds)
  {
    if (offset >= total) return new uint256[](0);

    uint256 end = offset + limit > total ? total : offset + limit;
    uint256 length = end - offset;
    paginatedActivityIds = new uint256[](length);

    for (uint256 i = 0; i < length; i++) {
      paginatedActivityIds[i] = activityIds[offset + i];
    }
  }

  function _findFirstActivityAtOrAfterForGlobal(uint256 timestamp) internal view returns (uint256) {
    if (noOfActivities == 0) return 0;

    uint256 left = 0;
    uint256 right = noOfActivities;

    while (left < right) {
      uint256 mid = left + (right - left) / 2;
      if (globalActivities[mid].timestamp < timestamp) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    return left;
  }

  function _findFirstActivityAtOrAfter(uint256 timestamp, uint256 total, uint256[] storage activityIds)
    internal
    view
    returns (uint256)
  {
    if (total == 0) return 0;

    uint256 left = 0;
    uint256 right = total;

    while (left < right) {
      uint256 mid = left + (right - left) / 2;
      if (globalActivities[activityIds[mid] - 1].timestamp < timestamp) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    return left;
  }

  function _paginateActivityIdsByTimeRange(
    uint256 startTime,
    uint256 endTime,
    uint256 offset,
    uint256 limit,
    uint256 total,
    uint256[] storage activityIds
  ) internal view returns (uint256[] memory paginatedActivityIds) {
    if (startTime > endTime) revert InvalidTimeRange();
    if (offset >= total) return new uint256[](0);

    uint256 startIndex = _findFirstActivityAtOrAfter(startTime, total, activityIds) + offset;
    if (startIndex >= total) return new uint256[](0);
    uint256 collected = 0;

    uint256[] memory temp = new uint256[](limit);
    for (uint256 i = startIndex; i < total && collected < limit; i++) {
      if (globalActivities[activityIds[i] - 1].timestamp >= endTime) break;
      temp[collected] = activityIds[i];
      collected++;
    }

    if (collected == 0) return new uint256[](0);
    if (collected == limit) return temp;
    paginatedActivityIds = new uint256[](collected);
    for (uint256 j = 0; j < collected; j++) {
      paginatedActivityIds[j] = temp[j];
    }
  }

  /// Gets a single activity by ID
  /// @param activityId ID of the activity
  /// @return activity The activity data
  function getOne(uint256 activityId) external view returns (CastoraActivity memory activity) {
    if (activityId == 0 || activityId > noOfActivities) revert InvalidActivityId();
    return globalActivities[activityId - 1];
  }

  /// Gets multiple activities by IDs
  /// @param activityIds Array of activity IDs
  /// @return activities Array of activity data
  function getMany(uint256[] calldata activityIds) external view returns (CastoraActivity[] memory activities) {
    activities = new CastoraActivity[](activityIds.length);
    for (uint256 i = 0; i < activityIds.length; i++) {
      if (activityIds[i] == 0 || activityIds[i] > noOfActivities) revert InvalidActivityId();
      activities[i] = globalActivities[activityIds[i] - 1];
    }
  }

  /// Gets paginated global activities
  /// @param offset Starting index
  /// @param limit Maximum activities to return
  /// @return activities Array of activities
  function getPaginated(uint256 offset, uint256 limit) external view returns (CastoraActivity[] memory activities) {
    if (offset >= noOfActivities) return new CastoraActivity[](0);

    uint256 end = offset + limit > noOfActivities ? noOfActivities : offset + limit;
    uint256 length = end - offset;
    activities = new CastoraActivity[](length);

    for (uint256 i = 0; i < length; i++) {
      activities[i] = globalActivities[offset + i];
    }
  }

  /// Gets paginated activities by type
  /// @param activityType Type of activities to retrieve
  /// @param offset Starting index
  /// @param limit Maximum activities to return
  /// @return activities Array of activities
  function getByTypePaginated(ActivityType activityType, uint256 offset, uint256 limit)
    external
    view
    returns (CastoraActivity[] memory activities)
  {
    uint256[] memory ids =
      _paginateActivityIds(activityIdsByType[activityType], noOfActivitiesByType[activityType], offset, limit);
    activities = new CastoraActivity[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
      activities[i] = globalActivities[ids[i] - 1];
    }
  }

  /// Gets paginated activities for a specific user
  /// @param user Address of the user
  /// @param offset Starting index
  /// @param limit Maximum activities to return
  /// @return activities Array of activities
  function getForAddressPaginated(address user, uint256 offset, uint256 limit)
    external
    view
    returns (CastoraActivity[] memory activities)
  {
    if (user == address(0)) revert InvalidAddress();
    uint256[] memory ids = _paginateActivityIds(userActivityIds[user], userActivityIdsCount[user], offset, limit);
    activities = new CastoraActivity[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
      activities[i] = globalActivities[ids[i] - 1];
    }
  }

  /// Gets paginated activities for a specific user by type
  /// @param user Address of the user
  /// @param activityType Type of activities to retrieve
  /// @param offset Starting index
  /// @param limit Maximum activities to return
  /// @return activities Array of activities
  function getForAddressByTypePaginated(address user, ActivityType activityType, uint256 offset, uint256 limit)
    external
    view
    returns (CastoraActivity[] memory activities)
  {
    if (user == address(0)) revert InvalidAddress();
    uint256[] memory ids = _paginateActivityIds(
      userActivityIdsByType[user][activityType], userActivityIdsCountByType[user][activityType], offset, limit
    );
    activities = new CastoraActivity[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
      activities[i] = globalActivities[ids[i] - 1];
    }
  }

  /// Gets the count of activities for a specific user by type
  /// @param user Address of the user
  /// @param activityType Type of activities to count
  /// @return count Number of activities
  function getActivityTypeCountForAddress(address user, ActivityType activityType)
    external
    view
    returns (uint256 count)
  {
    if (user == address(0)) revert InvalidAddress();
    return userActivityIdsCountByType[user][activityType];
  }

  /// Gets activities within a time range with single pass
  /// @param startTime Start timestamp (inclusive)
  /// @param endTime End timestamp (exclusive)
  /// @param offset Number of matching activities to skip
  /// @param limit Maximum number of activities to return
  /// @return activities Array of activities within the time range
  function getByTimeRangePaginated(uint256 startTime, uint256 endTime, uint256 offset, uint256 limit)
    external
    view
    returns (CastoraActivity[] memory activities)
  {
    if (startTime > endTime) revert InvalidTimeRange();
    if (offset >= noOfActivities) return new CastoraActivity[](0);

    uint256 startIndex = _findFirstActivityAtOrAfterForGlobal(startTime) + offset;
    if (startIndex >= noOfActivities) return new CastoraActivity[](0);
    uint256 collected = 0;

    CastoraActivity[] memory tempActivities = new CastoraActivity[](limit);

    for (uint256 i = startIndex; i < noOfActivities && collected < limit; i++) {
      if (globalActivities[i].timestamp >= endTime) break;
      tempActivities[collected] = globalActivities[i];
      collected++;
    }

    if (collected == 0) return new CastoraActivity[](0);
    if (collected == limit) return tempActivities;
    activities = new CastoraActivity[](collected);
    for (uint256 j = 0; j < collected; j++) {
      activities[j] = tempActivities[j];
    }
  }

  /// Gets activities by type within a time range with single pass
  /// @param activityType Type of activities to retrieve
  /// @param startTime Start timestamp (inclusive)
  /// @param endTime End timestamp (exclusive)
  /// @param offset Number of matching activities to skip
  /// @param limit Maximum number of activities to return
  /// @return activities Array of activities within the time range
  function getByTypeByTimeRangePaginated(
    ActivityType activityType,
    uint256 startTime,
    uint256 endTime,
    uint256 offset,
    uint256 limit
  ) external view returns (CastoraActivity[] memory activities) {
    uint256[] memory ids = _paginateActivityIdsByTimeRange(
      startTime, endTime, offset, limit, noOfActivitiesByType[activityType], activityIdsByType[activityType]
    );
    activities = new CastoraActivity[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
      activities[i] = globalActivities[ids[i] - 1];
    }
  }

  /// Gets user activities within a time range with single pass
  /// @param user Address of the user
  /// @param startTime Start timestamp (inclusive)
  /// @param endTime End timestamp (exclusive)
  /// @param offset Number of matching activities to skip
  /// @param limit Maximum number of activities to return
  /// @return activities Array of activities within the time range
  function getForAddressByTimeRangePaginated(
    address user,
    uint256 startTime,
    uint256 endTime,
    uint256 offset,
    uint256 limit
  ) external view returns (CastoraActivity[] memory activities) {
    uint256[] memory ids = _paginateActivityIdsByTimeRange(
      startTime, endTime, offset, limit, userActivityIdsCount[user], userActivityIds[user]
    );
    activities = new CastoraActivity[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
      activities[i] = globalActivities[ids[i] - 1];
    }
  }

  /// Gets user activities by type within a time range with single pass
  /// @param user Address of the user
  /// @param activityType Type of activities to retrieve
  /// @param startTime Start timestamp (inclusive)
  /// @param endTime End timestamp (exclusive)
  /// @param offset Number of matching activities to skip
  /// @param limit Maximum number of activities to return
  /// @return activities Array of activities within the time range
  function getForAddressByTypeByTimeRangePaginated(
    address user,
    ActivityType activityType,
    uint256 startTime,
    uint256 endTime,
    uint256 offset,
    uint256 limit
  ) external view returns (CastoraActivity[] memory activities) {
    uint256[] memory ids = _paginateActivityIdsByTimeRange(
      startTime,
      endTime,
      offset,
      limit,
      userActivityIdsCountByType[user][activityType],
      userActivityIdsByType[user][activityType]
    );
    activities = new CastoraActivity[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
      activities[i] = globalActivities[ids[i] - 1];
    }
  }

  /// Gets recent activities (last N activities)
  /// @param limit Maximum number of recent activities to return
  /// @return activities Array of recent activities
  function getRecentActivities(uint256 limit) external view returns (CastoraActivity[] memory activities) {
    if (limit > noOfActivities) limit = noOfActivities;
    if (limit == 0) return new CastoraActivity[](0);

    activities = new CastoraActivity[](limit);
    for (uint256 i = 0; i < limit; i++) {
      activities[i] = globalActivities[noOfActivities - 1 - i];
    }
  }

  function getRecentActivitiesByType(ActivityType activityType, uint256 limit)
    external
    view
    returns (CastoraActivity[] memory activities)
  {
    if (limit > noOfActivitiesByType[activityType]) limit = noOfActivitiesByType[activityType];
    if (limit == 0) return new CastoraActivity[](0);

    activities = new CastoraActivity[](limit);
    for (uint256 i = 0; i < limit; i++) {
      activities[i] = globalActivities[activityIdsByType[activityType][noOfActivitiesByType[activityType] - 1 - i] - 1];
    }
  }

  function getRecentActivitiesForAddress(address user, uint256 limit)
    external
    view
    returns (CastoraActivity[] memory activities)
  {
    if (user == address(0)) revert InvalidAddress();
    if (limit > userActivityIdsCount[user]) limit = userActivityIdsCount[user];
    if (limit == 0) return new CastoraActivity[](0);

    activities = new CastoraActivity[](limit);
    for (uint256 i = 0; i < limit; i++) {
      activities[i] = globalActivities[userActivityIds[user][userActivityIdsCount[user] - 1 - i] - 1];
    }
  }

  function getRecentActivitiesForAddressByType(address user, ActivityType activityType, uint256 limit)
    external
    view
    returns (CastoraActivity[] memory activities)
  {
    if (user == address(0)) revert InvalidAddress();
    if (limit > userActivityIdsCountByType[user][activityType]) limit = userActivityIdsCountByType[user][activityType];
    if (limit == 0) return new CastoraActivity[](0);

    activities = new CastoraActivity[](limit);
    for (uint256 i = 0; i < limit; i++) {
      activities[i] = globalActivities[userActivityIdsByType[user][activityType][userActivityIdsCountByType[user][activityType]
        - 1 - i] - 1];
    }
  }

  /// Sets authorization status for a contract
  /// @param contractAddr Address of the contract to authorize/deauthorize
  /// @param authorized Whether the contract should be authorized
  function setAuthorizedLogger(address contractAddr, bool authorized) external onlyOwner {
    if (contractAddr == address(0)) revert InvalidAddress();
    isAuthorizedLogger[contractAddr] = authorized;
    emit AuthorizedContractUpdated(contractAddr, authorized);
  }

  /// Logs a new activity (called by authorized contracts)
  /// @param poolId Related pool ID
  /// @param user Address of the user performing the activity
  /// @param activityType Type of activity being logged
  /// @param refGlobalCount Reference count in source contract
  function log(uint256 poolId, address user, ActivityType activityType, uint256 refGlobalCount) external nonReentrant {
    if (!isAuthorizedLogger[msg.sender]) revert UnauthorizedActivityLogger();
    if (poolId == 0) revert InvalidPoolId();
    if (user == address(0)) revert InvalidAddress();
    if (refGlobalCount == 0) revert InvalidActivityId();

    // Create activity
    CastoraActivity memory activity = CastoraActivity({
      timestamp: block.timestamp,
      poolId: poolId,
      user: user,
      activityType: activityType,
      sourceContract: msg.sender,
      refGlobalCount: refGlobalCount
    });

    // Update counters
    noOfActivities += 1;
    noOfActivitiesByType[activityType] += 1;
    userActivityIdsCount[user] += 1;
    userActivityIdsCountByType[user][activityType] += 1;

    // Store activity
    uint256 activityId = noOfActivities;
    globalActivities.push(activity);
    activityIdsByType[activityType].push(activityId);
    userActivityIds[user].push(activityId);
    userActivityIdsByType[user][activityType].push(activityId);

    // Update user engagement tracking
    _updateUserActivityTimes(user, activityId);
  }
}
