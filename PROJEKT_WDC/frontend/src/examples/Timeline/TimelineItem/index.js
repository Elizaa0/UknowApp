/**
=========================================================
* Soft UI Dashboard React - v4.0.1
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// prop-types is a library for typechecking of props
import PropTypes from "prop-types";

// @mui material components
import Icon from "@mui/material/Icon";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftBadge from "components/SoftBadge";

// Timeline context
import { useTimeline } from "examples/Timeline/context";

// Custom styles for the TimelineItem
import { timelineItem, timelineItemIcon } from "examples/Timeline/TimelineItem/styles";

function TimelineItem({ color, icon, title, dateTime, description, badges, lastItem }) {
  const isDark = useTimeline();

  // Dodaj to:
  const safeBadges = Array.isArray(badges) ? badges : [];

  const renderBadges =
    safeBadges.length > 0
      ? safeBadges.map((badge, key) => {
          const badgeKey = `badge-${key}`;
          return (
            <SoftBox key={badgeKey} mr={key === safeBadges.length - 1 ? 0 : 0.5}>
              <SoftBadge color={color} size="xs" badgeContent={badge} container />
            </SoftBox>
          );
        })
      : null;

  return (
    <SoftBox position="relative" sx={(theme) => timelineItem(theme, { lastItem })}>
      {/* ... */}
      <SoftBox mt={2} mb={1.5}>
        {description ? (
          <SoftTypography variant="button" fontWeight="regular" color="text">
            {description}
          </SoftTypography>
        ) : null}
      </SoftBox>
      {/* Poprawka tu: */}
      {safeBadges.length > 0 ? (
        <SoftBox display="flex" pb={lastItem ? 1 : 2}>
          {renderBadges}
        </SoftBox>
      ) : null}
    </SoftBox>
  );
}


// Setting default values for the props of TimelineItem
TimelineItem.defaultProps = {
  color: "info",
  badges: [],
  lastItem: false,
  description: "",
};

// Typechecking props for the TimelineItem
TimelineItem.propTypes = {
  color: PropTypes.oneOf([
    "primary",
    "secondary",
    "info",
    "success",
    "warning",
    "error",
    "dark",
    "light",
  ]),
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  dateTime: PropTypes.string.isRequired,
  description: PropTypes.string,
  badges: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  lastItem: PropTypes.bool,
};

export default TimelineItem;
