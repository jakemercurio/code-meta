<?php

namespace StockBlocks\Common\Modules\Signup\Controllers;

use Exception;
use InvalidArgumentException;
use MicroServices\Billing\FraudDetermination\MembershipPurchaseFraudDeterminationService;
use StockBlocks\Common\Entities\AbTestHooks;
use StockBlocks\Common\Entities\CreditCard;
use StockBlocks\Common\Entities\Members\Members;
use StockBlocks\Common\Entities\SiteFunctions;
use StockBlocks\Common\Framework\TimeInSeconds;
use StockBlocks\Common\Framework\AssetContext;
use StockBlocks\Common\Framework\SiteAuthentication;
use StockBlocks\Common\Framework\SiteConstants;
use StockBlocks\Common\Framework\SiteStaticMessages;
use StockBlocks\Common\Framework\Tracking\UserTracker;
use StockBlocks\Common\Logging\LogData\LogDataKeys;
use StockBlocks\Common\Modules\Home\Routes\HomeRouteCollection;
use StockBlocks\Common\Modules\Signup\DTOs\JoinTemplateEnum;
use StockBlocks\Common\Modules\User\Routes\UserRouteCollection;
use StockBlocks\Common\Services\AbTests\AbTestHooksService;
use StockBlocks\Common\Services\CrossSell\Factories\CrossSellEligibilityServiceFactory;
use StockBlocks\Common\Services\DisposableEmail\DisposableEmailValidationService;
use StockBlocks\Common\Services\Events\EventModels\MemberEvents\MemberEventService;
use StockBlocks\Common\Services\Members\MemberBrowserProfilesEntityService;
use StockBlocks\Common\Services\Members\MemberEntityService;
use StockBlocks\Common\Services\Members\MemberPaymentsEntityService;
use StockBlocks\Common\Services\Members\Step1MemberCampaignProfilesEntityService;
use StockBlocks\Common\Services\OrganizationsEntityService;
use StockBlocks\Common\Services\PromotionalOffersEntityService;
use StockBlocks\Common\Services\Signup\CvvAvsZipValidationType;
use StockBlocks\Common\Services\Signup\ForceBill;
use StockBlocks\Common\Services\Signup\MembershipType;
use StockBlocks\Common\Services\Signup\SubscriptionService;
use StockBlocks\Common\Services\UserLeads\Create\UserLeadService_Create_DisposableEmailError;
use StockBlocks\Common\Services\UserLeads\Create\UserLeadService_Create_EmailInUseError;
use StockBlocks\Common\Services\UserLeads\Create\UserLeadService_Create_EmailInUseOnBundledSiteError;
use StockBlocks\Common\Services\UserLeads\Create\UserLeadService_Create_Error;
use StockBlocks\Common\Services\UserAttributes\UserAttributeNames;
use StockBlocks\Common\Services\UserLeads\UserLead;
use StockBlocks\Common\Templates\Controllers\SiteController;
use StockBlocks\Common\Widgets\Widgets\Form\FormHiddenInputWidget;
use StockBlocks\Common\Widgets\Widgets\Form\FormSelectInputWidget;
use StockBlocks\Common\Widgets\Widgets\Form\FormTextInputWidget;
use StockBlocks\Mvc\ActionResults\MvcStringResult;
use StockBlocks\Mvc\Helpers\MvcHttpRequest;
use StockBlocks\Mvc\Helpers\MvcPhpUtils;
use StockBlocks\Mvc\Logging\MvcLogService;
use StockBlocks\Mvc\Routes\MvcRouter;
use StockBlocks\VideoBlocks\Entities\SignupFunnel;
use StockBlocks\VideoBlocks\Modules\StockDetails\Controllers\CompDownloadManager;

class SignupController extends SiteController {

    const SHOW_PROMO_FIELD = 'c';
    const SHOW_SHORT_FORM = 'sf';
    const SHOW_ANNUAL_ONLY = 'a';

    // TODO: consider a language service for these
    protected $emailInUseMessage;
    protected $emailDisposableMessage;

    public function __construct($template = null, AssetContext $assetContext = null) {
        parent::__construct($template, $assetContext);
        $this->viewPath = __DIR__ . '/../Views/';

        $this->emailInUseMessage = 'That account already exists, please <a href=\''.MvcRouter::MakeRoute(UserRouteCollection::LOGIN_PAGE).'\'><u>log in</u></a>.';
        $this->emailDisposableMessage = 'Please enter a valid email address.';
    }

    public function getEmailInUseMessage() : string {
        return $this->emailInUseMessage;
    }

    public function getEmailDisposableMessage() : string {
        return $this->emailDisposableMessage;
    }

    /**
     * Used during the signup process to check if the email is valid or not
     */
    public function checkEmail($withMessaging = false) : MvcStringResult {
        $isEmailValid = "true";
        $email = MvcHttpRequest::urlParam(FormTextInputWidget::TYPE_EMAIL);

        if (!$this->isEmailUnique($email)) {
            $isEmailValid = $withMessaging ? '"'.$this->emailInUseMessage.'"' : "false";
        } else if ($this->isEmailDisposable($email)) {
            $isEmailValid = $withMessaging ? '"'.$this->emailDisposableMessage.'"' : "false";
        }

        return $this->String($isEmailValid);
    }

    private function isEmailUnique($email) {
        return !MemberEntityService::getInstance()->checkIfEmailInUse($email);
    }

    private function isEmailDisposable($email) {
        return DisposableEmailValidationService::isDisposableEmailAddress($email);
    }

    public function checkCrossSellEligibility() {
        $email = MvcHttpRequest::postParam(FormTextInputWidget::TYPE_EMAIL);
        $planUniqueId = MvcHttpRequest::postParam(FormHiddenInputWidget::TYPE_PLAN_UNIQUE_ID);
        $memberExistsOnCurrentSite = MemberEntityService::getInstance()->checkIfEmailInUse($email);

        $isEliglible = !$memberExistsOnCurrentSite;

        if ($isEliglible) {
            try {
                $crossSellChecker = CrossSellEligibilityServiceFactory::createCrossSellEligibilityService($email, $planUniqueId);
                $dto = $crossSellChecker->getCrossSellEligibility();
                $isEliglible = $dto->isEligibleOnAllSites();
            } catch (\Exception $e) {
                MvcLogService::warn('Exception while checking cross sell eligibility ajax call', [LogDataKeys::STEP1_EMAIL => $email], $e);
                $isEliglible = false;
            }
        }

        return $isEliglible ? $this->String('true') : $this->String('false');
    }

    /**
     * @var string $signupFunnel
     *
     * @param bool $passwordIsHashed
     *
     * @return \stdclass
     */
    protected function Step2Process(String $signupFunnel) {

        $unique_id = MvcHttpRequest::postParam(FormHiddenInputWidget::TYPE_UNIQUE_ID);
        $userLead = $this->userLeadService->getByUniqueId($unique_id);

        if (!$userLead){
            MvcLogService::warn('null userLead during step2 process', [ 'unique_id' => $unique_id ] );

            $retObj = new \stdClass();
            $retObj->success = false;
            $retObj->message = 'Invalid userLead';

            return $retObj;
        }

        $password = MvcHttpRequest::postParam(FormTextInputWidget::TYPE_PASSWORD);
        if ($password) {
            // How the Hell was this used?
//            $userLead->setPassword($password, false);
        }

        if ($this->isFraudulentAttempt($userLead)) {

            $this->logSignupAttemptExceeded($userLead);

            $retObj = new \stdClass();
            $retObj->success = false;
            $retObj->message = SiteStaticMessages::MAX_SIGNUP_ATTEMPTS_EXCEEDED . SiteConstants::GetSiteSupportPhone();

            return $retObj;
        }

        $ccNumber = MvcPhpUtils::removeNonDigitsFromString(MvcHttpRequest::postParam(FormTextInputWidget::TYPE_CREDIT_CARD_NUMBER));
        $ccExpMonth = MvcHttpRequest::postParam(FormSelectInputWidget::TYPE_CC_EXP_MONTH);
        $ccExpYear = MvcHttpRequest::postParam(FormSelectInputWidget::TYPE_CC_EXP_YEAR);
        $ccCvvFromPost = MvcHttpRequest::postParam(FormTextInputWidget::TYPE_CREDIT_CARD_CVV);

        $ccCvv = (MvcPhpUtils::isNotEmptyOrNull($ccCvvFromPost)) ? $ccCvvFromPost : null;
        $creditCard = new CreditCard($ccNumber, $ccExpMonth, $ccExpYear, $ccCvv);

        if ($this->creditCardAlreadyTriggeredPicUpCardForUserLead($creditCard, $userLead)) {
            $retObj = new \stdClass();
            $retObj->success = false;
            $retObj->message = SiteStaticMessages::FRAUDULENT_USER_PICUP_CARD_MESSAGE .
                'Please contact your issuing bank for further information ' .
                'or if you need any additional information please contact our Customer Service ' .
                'at ' . SiteConstants::GetSiteSupportEmail() . ' or by phone at ' . SiteConstants::GetSiteSupportPhone();

            return $retObj;
        }

        $userLead = $this->updateBillingProfile();

        $userTracker = new UserTracker();

        $subscriptionService = SubscriptionService::getInstance();
        $subscriptionService->setPaymentGateway(new ForceBill(ForceBill::FORCEBILL_LIMELIGHT));

        $this->logSignupAttempt($userLead);

        $cvvValidationType = static::shouldValidateCvvAndZip($userLead);

        $retObj = $subscriptionService->processFinalMember($userLead, $creditCard, $userTracker, 0.00, $cvvValidationType);

        if ($retObj->success) {
            $memberId = $retObj->info->memberId;
            $member = MemberEntityService::getInstance()->get($memberId);

            // Update member with visitor marketplace access permissions.
            $this->transferVisitorPermissionsToMember($member);

            $member = $this->addMemberToVbOrgIfAppropriate($member, $creditCard);

            /**
             * AB Testing hooks that have to run after successful member creation
             * DO NOT MODIFY OR DELETE
             */
            AbTestHooks::UpdateTrackingAddMember($userLead, $memberId);

            AbTestHooks::processNewMembers($member, $this->getVisitorId());
            if ($signupFunnel === SignupFunnel::FREETRIAL) {
                AbTestHooks::ProcessFreeTrialStep2Member($member, $this->getVisitorId());
            } else if ($signupFunnel === SignupFunnel::JOIN) {
                AbTestHooks::ProcessJoinNewMembers($member, $this->getVisitorId());
            }

            SignupController::captureBrowserProfileAndLogInMember($member);
            MemberEventService::triggerSignupEvent($member, $signupFunnel);
        }

        return $retObj;
    }

    /**
     * If we already got a "PIC UP CARD" message for this step 1 member with
     * the same credit card, we would not want to run it by the payment gateway again.
     *
     * @param CreditCard $creditCard
     * @param UserLead $userLead
     *
     * @return bool
     */
    private function creditCardAlreadyTriggeredPicUpCardForUserLead(CreditCard $creditCard, UserLead $userLead) {
        $paymentsEntityService = MemberPaymentsEntityService::getInstance();
        return $paymentsEntityService->getNumberOfPicUpLookupsForUserLead($creditCard->getFirstSix(), $creditCard->getLastFour(), $userLead) > 0;
    }

    protected function transferVisitorPermissionsToMember(Members $member) {
        // Do nothing by default.
    }

    /**
     * This function captures the browser profile, ie javascript, cookie availablity etc
     * and then logs the member in
     *
     * @param Members $member
     */
    public static function captureBrowserProfileAndLogInMember(Members $member) {

        $cookieLength = TimeInSeconds::THIRTY_DAYS;

        SiteAuthentication::LogIn($member->getId(), new TimeInSeconds($cookieLength));
        MemberBrowserProfilesEntityService::getInstance()->captureMemberBrowserProfile($member);

    }

    public static function mockNoCCCreditCard() {
        return new CreditCard(SiteConstants::NOCC_CC_NUMBER, SiteConstants::NOCC_CC_EXP_MONTH, SiteConstants::NOCC_CC_EXP_YEAR);
    }

    /**
     * Creates a UserLead and adds a No-CC Account
     *
     * @param MembershipType $type
     * @param null $planUniqueId
     *
     * @return \stdclass
     */
    public function createUserLeadAndaNoCreditCardMemberAccount(MembershipType $type, $planUniqueId = null) {

        $userLeadResponse = $this->Step1Process($type, $planUniqueId);

        if ($userLeadResponse->success) {
            $createNoAuthCCAccountForMemberResponse = $this->CreateNoAuthAccount($userLeadResponse->info->step1UniqueId);

            if ($createNoAuthCCAccountForMemberResponse->success) {
                $member = MemberEntityService::getInstance()->get($createNoAuthCCAccountForMemberResponse->info->memberId);
                self::captureBrowserProfileAndLogInMember($member);

            }

            return $createNoAuthCCAccountForMemberResponse;
        }

        return $userLeadResponse;
    }

    /**
     * @param MembershipType $type (Free or Paid)
     * @param string $planIdOrUniqueId
     *
     * @return \stdclass
     */
    public function Step1Process(MembershipType $type, $planIdOrUniqueId = null, $isShortForm = null) {

        try {

            $visitorCookieId = $this->getVisitorId();
            $isEmailOnlyFlow = $this->isEmailOnlySignupFlow($type);
            $userLead = $this->userLeadService->createFromStep1FormRequest($type, $planIdOrUniqueId, $isShortForm, $isEmailOnlyFlow);

            AbTestHooksService::runSuccessfulUserLeadCreationAbTestingHooks($userLead, $visitorCookieId, $type);

            $this->addUserLeadEvent($userLead, $type);

            Step1MemberCampaignProfilesEntityService::getInstance()->addMarketingInfo_ParallelTrackingFromCookie($userLead, MvcHttpRequest::getCookie(UserTracker::COOKIE_CAMPAIGN_DATA));

            $info = new \stdClass();
            //[ULID]
            $info->step1MemberId = $userLead->getStep1MemberId();
            $info->step1UniqueId = $userLead->getUniqueId();

            if ($type->is(MembershipType::COMP_DOWNLOAD_SIGNUP)) {
                CompDownloadManager::setUserInfo($userLead);
            }

            return SiteFunctions::ReturnObject(true, 'Successfully created UserLead', $info);

        } catch (UserLeadService_Create_EmailInUseError $e) {

            MvcLogService::warn('User Lead email was in use', null, $e);

            return SiteFunctions::ReturnObject(false, SiteStaticMessages::ACCOUNT_EXISTS);

        } catch (UserLeadService_Create_EmailInUseOnBundledSiteError $e) {

            $message = SiteStaticMessages::ACCOUNT_EXISTS_ON_BUNDLED_SITE
                . ' Call us at ' . SiteConstants::GetSiteSupportPhone() . '.'
                . ' Or email us at ' . SiteConstants::GetSiteSupportEmail() . '.';
            return SiteFunctions::ReturnObject(false, $message);

        } catch (UserLeadService_Create_DisposableEmailError $e) {
            return SiteFunctions::ReturnObject(false, SiteStaticMessages::DISPOSABLE_EMAIL_ERROR);

        } catch (UserLeadService_Create_Error $e) {
            return SiteFunctions::ReturnObject(false, SiteStaticMessages::DEFAULT_INTERNAL_ERROR_MSG);
        } catch (InvalidArgumentException $e) {
            $message = $e->getMessage();
            $messageToUser = "<ul><li>$message</li></ul>";
            return SiteFunctions::ReturnObject(false, $messageToUser);
        } catch (Exception $e) { // In case planId / promotional offer are invalid somehow
            return SiteFunctions::ReturnObject(false, SiteStaticMessages::DEFAULT_INTERNAL_ERROR_MSG);
        }
    }

    /**
     * Creates a No-Auth Account on the site
     *
     * @param string $uniqueId
     *
     * @return \stdclass
     */

    protected function CreateNoAuthAccount($uniqueId) {

        if (SiteAuthentication::IsLoggedIn()) {
            return $this->redirect(MvcRouter::MakeRoute(HomeRouteCollection::Home));
        }

        $userLead = $this->userLeadService->getByUniqueId($uniqueId);

        if ($userLead === null) {
            return false;
        }

        if (MvcHttpRequest::postParam(FormTextInputWidget::TYPE_CREDIT_CARD_NUMBER) != '') {

            $ccNumber = MvcHttpRequest::postParam(FormTextInputWidget::TYPE_CREDIT_CARD_NUMBER);
            $expMonth = MvcHttpRequest::postParam(FormSelectInputWidget::TYPE_CC_EXP_MONTH);
            $expYear = MvcHttpRequest::postParam(FormSelectInputWidget::TYPE_CC_EXP_YEAR);

            $creditCard = new CreditCard($ccNumber, $expMonth, $expYear);

        } else {
            $creditCard = self::mockNoCCCreditCard();
        }

        $userTracker = new UserTracker();

        return SubscriptionService::getInstance()->createNoCCAuthAccount($userLead, $creditCard, $userTracker);

    }

    // HELPER FUNCTIONS

    private function addUserLeadEvent(UserLead $userLead, MembershipType $type) {

        // TODO: move this to the step1/signup event since funnels are customerIO specific
        switch ($type->getValue()) {
            case MembershipType::EXIT_INTENT:
                $funnel = SignupFunnel::EXIT_INTENT;
                break;
            case MembershipType::TRIAL:
                $funnel = SignupFunnel::FREETRIAL;
                break;
            case MembershipType::PAID:
                $funnel = SignupFunnel::JOIN;
                break;
            case MembershipType::MARKETPLACE_TRIAL:
                $funnel = SignupFunnel::MARKETPLACE_FREETRIAL;
                break;
            case MembershipType::MARKETPLACE_PAID:
                $funnel = SignupFunnel::MARKETPLACE_JOIN;
                break;
            case MembershipType::MARKETPLACE_STEP1:
                $funnel = SignupFunnel::MARKETPLACE_STEP1;
                break;
            case MembershipType::COMP_DOWNLOAD_SIGNUP:
                $funnel = SignupFunnel::COMP_DOWNLOAD;
                break;
            case MembershipType::MOBILE_SIGNUP:
                $funnel = SignupFunnel::RESPONSIVE;
                break;
            default:
                $funnel = SignupFunnel::PARTNER;
        }

        MemberEventService::triggerAddUserLead($userLead, $funnel);
    }

    private function addMemberToVbOrgIfAppropriate(Members $member, CreditCard $creditCard){
        if ($creditCard->isDummyCreditCard() && $member->isInternalUser()) {
            $org = OrganizationsEntityService::getInstance()->getByShortName("videoblocks");
            $member->setOrganizationId($org);
            MemberEntityService::getInstance()->saveAndLog($member);
        }
        return $member;
    }

    private function logSignupAttempt(UserLead $userLead) {
        $signupAttempts = $userLead->getSignupAttempts();
        //TODO: Move signup attempts to attribute? At least in new service.
        $this->userLeadService->updateSignupAttempts($userLead, $signupAttempts + 1);
    }

    private function logSignupAttemptExceeded(UserLead $userLead) {

        $attributeName = UserAttributeNames::SIGNUP_ATTEMPTS_EXCEEDED;

        $numTimesExceeded = 1;
        $numTimesSignupAttemptsExceededAttribute = $this->userAttributeService->getByUserLead($userLead, $attributeName);
        if ($numTimesSignupAttemptsExceededAttribute) {
            $numTimesExceeded = $numTimesSignupAttemptsExceededAttribute->getValue() + 1;
        }

        $this->userAttributeService->setUserLeadAttribute($userLead, $attributeName, $numTimesExceeded);
    }

    private function updateBillingProfile() {
        return $this->userLeadService->updateBillingProfileFromRequest();
    }

    protected function updateUserLeadPlanId(UserLead $userLead, $planId) : UserLead {
        if (MvcPhpUtils::isNotEmptyOrNull($planId)) {
            $userLead = $this->userLeadService->updatePlanId($userLead, $planId);
        }

        return $userLead;
    }

    public static function shouldValidateCvvAndZip(UserLead $userLead) : CvvAvsZipValidationType {

        $shouldValidate = MvcHttpRequest::urlParam(JoinController::PARAM_TEMPLATE) !== JoinTemplateEnum::JOIN_TEMPLATE_FACEBOOK;

        return $shouldValidate ? CvvAvsZipValidationType::of(CvvAvsZipValidationType::CVV_AVS_ZIP) :
            CvvAvsZipValidationType::of(CvvAvsZipValidationType::NONE);
    }

    protected function getPromotionalOfferFromRequest() {
        $promotionalOfferUniqueName = MvcHttpRequest::urlParam('offer');
        return PromotionalOffersEntityService::getInstance()->getByOfferNameUnique($promotionalOfferUniqueName);
    }

    private function isFraudulentAttempt(UserLead $userLead) {
        $response = MembershipPurchaseFraudDeterminationService::checkMembershipPurchaseFraudAttempt($userLead);
        return $response && $response->getIsFraudulentAttempt();
    }

    protected function shouldShowCrossSellTopBarWidget() {
        return false;
    }

    protected function isEmailOnlySignupFlow(MembershipType $type) {
        $emailOnlySignups = [
            MembershipType::COMP_DOWNLOAD_SIGNUP,
            MembershipType::MOBILE_SIGNUP,
            MembershipType::EXIT_INTENT,
            MembershipType::EMAIL_CAPTURE
        ];

        return in_array($type->getValue(), $emailOnlySignups);
    }

}
