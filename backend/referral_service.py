import uuid
import hashlib
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from urllib.parse import urlencode
import re

from api_models import (
    ReferralLinkConfig, SocialSharingConfig, ReferralLink, ReferralClick,
    SocialPlatform, CreateReferralLinkRequest, UpdateSocialConfigRequest,
    UpdateLinkConfigRequest, ReferralAnalytics
)

class ReferralService:
    """
    Service class for managing referral links and social sharing
    Implements business logic with proper error handling and validation
    """

    def __init__(self):
        # In-memory storage for demo - replace with actual database
        self.link_configs: Dict[str, ReferralLinkConfig] = {}
        self.social_configs: Dict[str, SocialSharingConfig] = {}
        self.referral_links: Dict[str, ReferralLink] = {}
        self.referral_clicks: List[ReferralClick] = []

        # Initialize default configs
        self._initialize_default_configs()

    def _initialize_default_configs(self):
        """Initialize default configurations for new shops"""
        default_shop = "demo.myshopify.com"

        # Default link configuration
        self.link_configs[default_shop] = ReferralLinkConfig(
            shop_domain=default_shop,
            custom_slug="ref",
            use_utm_parameters=True,
            use_url_shortener=False
        )

        # Default social sharing configuration
        self.social_configs[default_shop] = SocialSharingConfig(
            shop_domain=default_shop,
            enabled=True,
            platforms=[SocialPlatform.FACEBOOK, SocialPlatform.TWITTER],
            default_message="I love shopping at [Store Name]! Use my referral link for a special discount: [Referral Link]",
            use_platform_specific=True,
            platform_messages={
                SocialPlatform.FACEBOOK: "Check out [Store Name]! Use my referral link for exclusive savings: [Referral Link] 🛍️",
                SocialPlatform.TWITTER: "Love shopping at [Store Name]! Get a discount with my link: [Referral Link] #shopping #deals",
                SocialPlatform.INSTAGRAM: "Shopping at [Store Name] 🛍️ Use my referral link for special offers: [Referral Link]"
            }
        )

    def get_link_config(self, shop_domain: str) -> ReferralLinkConfig:
        """Get referral link configuration for a shop"""
        if shop_domain not in self.link_configs:
            self.link_configs[shop_domain] = ReferralLinkConfig(shop_domain=shop_domain)
        return self.link_configs[shop_domain]

    def update_link_config(self, shop_domain: str, update_data: UpdateLinkConfigRequest) -> ReferralLinkConfig:
        """Update referral link configuration"""
        config = self.get_link_config(shop_domain)

        # Update only provided fields
        update_dict = update_data.dict(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(config, key, value)

        config.updated_at = datetime.utcnow()
        return config

    def get_social_config(self, shop_domain: str) -> SocialSharingConfig:
        """Get social sharing configuration for a shop"""
        if shop_domain not in self.social_configs:
            self.social_configs[shop_domain] = SocialSharingConfig(shop_domain=shop_domain)
        return self.social_configs[shop_domain]

    def update_social_config(self, shop_domain: str, update_data: UpdateSocialConfigRequest) -> SocialSharingConfig:
        """Update social sharing configuration"""
        config = self.get_social_config(shop_domain)

        # Update only provided fields
        update_dict = update_data.dict(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(config, key, value)

        config.updated_at = datetime.utcnow()
        return config

    def generate_referral_code(self, customer_id: str, shop_domain: str) -> str:
        """Generate a unique referral code for a customer"""
        # Create a hash from customer_id, shop_domain, and timestamp
        timestamp = str(int(datetime.utcnow().timestamp()))
        raw_string = f"{customer_id}-{shop_domain}-{timestamp}"
        hash_object = hashlib.md5(raw_string.encode())
        return hash_object.hexdigest()[:8].upper()

    def build_referral_url(self, shop_domain: str, referral_code: str, customer_name: str) -> str:
        """Build complete referral URL with UTM parameters"""
        link_config = self.get_link_config(shop_domain)

        # Base URL
        base_url = f"https://{shop_domain}/{link_config.custom_slug}/{customer_name.lower().replace(' ', '-')}"

        # UTM Parameters
        if link_config.use_utm_parameters:
            utm_params = {
                'utm_source': 'referral_program',
                'utm_medium': 'social',
                'utm_campaign': f'referral_{referral_code}',
                'ref': referral_code
            }
            return f"{base_url}?{urlencode(utm_params)}"
        else:
            return f"{base_url}?ref={referral_code}"

    def create_referral_link(self, shop_domain: str, request: CreateReferralLinkRequest) -> ReferralLink:
        """Create a new referral link for a customer"""
        # Generate unique referral code
        referral_code = self.generate_referral_code(request.customer_id, shop_domain)

        # Build full URL
        full_url = self.build_referral_url(shop_domain, referral_code, request.customer_name)

        # Create referral link object
        referral_link = ReferralLink(
            id=str(uuid.uuid4()),
            shop_domain=shop_domain,
            customer_id=request.customer_id,
            customer_name=request.customer_name,
            referral_code=referral_code,
            full_url=full_url
        )

        # Store the link
        self.referral_links[referral_link.id] = referral_link

        return referral_link

    def get_referral_links_by_customer(self, shop_domain: str, customer_id: str) -> List[ReferralLink]:
        """Get all referral links for a specific customer"""
        return [
            link for link in self.referral_links.values()
            if link.shop_domain == shop_domain and link.customer_id == customer_id and link.is_active
        ]

    def get_sharing_message(self, shop_domain: str, platform: SocialPlatform, referral_link: ReferralLink) -> str:
        """Get platform-specific sharing message with variables replaced"""
        social_config = self.get_social_config(shop_domain)

        # Get message template
        if social_config.use_platform_specific and platform in social_config.platform_messages:
            template = social_config.platform_messages[platform]
        else:
            template = social_config.default_message

        # Replace variables
        message = template.replace('[Store Name]', shop_domain.replace('.myshopify.com', '').title())
        message = message.replace('[Referral Link]', referral_link.full_url)
        message = message.replace('[Customer Name]', referral_link.customer_name)
        message = message.replace('[Discount]', '10% off')  # Could be dynamic

        return message

    def track_referral_click(self, referral_code: str, ip_address: str, user_agent: str,
                           utm_source: Optional[str] = None, utm_medium: Optional[str] = None,
                           utm_campaign: Optional[str] = None) -> Optional[ReferralClick]:
        """Track a referral link click"""
        # Find the referral link
        referral_link = None
        for link in self.referral_links.values():
            if link.referral_code == referral_code and link.is_active:
                referral_link = link
                break

        if not referral_link:
            return None

        # Determine platform from UTM source
        platform = None
        if utm_source:
            platform_mapping = {
                'facebook': SocialPlatform.FACEBOOK,
                'twitter': SocialPlatform.TWITTER,
                'instagram': SocialPlatform.INSTAGRAM,
                'linkedin': SocialPlatform.LINKEDIN,
                'email': SocialPlatform.EMAIL
            }
            platform = platform_mapping.get(utm_source.lower())

        # Create click tracking record
        click = ReferralClick(
            id=str(uuid.uuid4()),
            referral_link_id=referral_link.id,
            ip_address=ip_address,
            user_agent=user_agent,
            platform=platform,
            utm_source=utm_source,
            utm_medium=utm_medium,
            utm_campaign=utm_campaign
        )

        # Store the click
        self.referral_clicks.append(click)

        # Update link click count
        referral_link.clicks += 1

        return click

    def mark_conversion(self, referral_code: str, order_id: str, order_value: float) -> bool:
        """Mark a referral as converted (purchase made)"""
        # Find the referral link
        referral_link = None
        for link in self.referral_links.values():
            if link.referral_code == referral_code:
                referral_link = link
                break

        if not referral_link:
            return False

        # Update referral link
        referral_link.conversions += 1
        referral_link.revenue_generated += order_value

        # Find and update the click record
        for click in reversed(self.referral_clicks):
            if click.referral_link_id == referral_link.id and not click.converted:
                click.converted = True
                click.order_id = order_id
                break

        return True

    def get_analytics(self, shop_domain: str, days: int = 30) -> ReferralAnalytics:
        """Get referral analytics for the past N days"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        # Filter data for the shop and date range
        shop_links = [link for link in self.referral_links.values() if link.shop_domain == shop_domain]
        recent_clicks = [
            click for click in self.referral_clicks
            if click.timestamp >= cutoff_date and any(
                link.id == click.referral_link_id for link in shop_links
            )
        ]

        # Calculate metrics
        total_links = len([link for link in shop_links if link.is_active])
        total_clicks = len(recent_clicks)
        total_conversions = len([click for click in recent_clicks if click.converted])
        conversion_rate = (total_conversions / total_clicks * 100) if total_clicks > 0 else 0
        revenue_today = sum(link.revenue_generated for link in shop_links)

        # Top referrers
        referrer_stats = {}
        for link in shop_links:
            referrer_stats[link.customer_name] = {
                'clicks': link.clicks,
                'conversions': link.conversions,
                'revenue': link.revenue_generated
            }

        top_referrers = sorted(
            [{'name': name, **stats} for name, stats in referrer_stats.items()],
            key=lambda x: x['revenue'],
            reverse=True
        )[:5]

        return ReferralAnalytics(
            shop_domain=shop_domain,
            date=datetime.utcnow(),
            total_links=total_links,
            total_clicks=total_clicks,
            total_conversions=total_conversions,
            conversion_rate=round(conversion_rate, 2),
            revenue_today=revenue_today,
            top_referrers=top_referrers
        )

    def validate_referral_code(self, referral_code: str) -> bool:
        """Validate if a referral code exists and is active"""
        return any(
            link.referral_code == referral_code and link.is_active
            for link in self.referral_links.values()
        )

    def deactivate_referral_link(self, link_id: str) -> bool:
        """Deactivate a referral link"""
        if link_id in self.referral_links:
            self.referral_links[link_id].is_active = False
            return True
        return False