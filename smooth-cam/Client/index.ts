import * as Alt from "alt-client";
import * as Native from "natives";

type PlayerPosRot = { position: Alt.Vector3; rotation: Alt.Vector3 };
class SmoothDirectorCam {
    private static WorldPositions: PlayerPosRot[] = [];
    private static noClip = false;
    private static playerPed = Alt.Player.local.scriptID;

    public static Init() {
        Alt.on("SmoothDirectorCam:SavedCoords", () => console.log("Saved Coords to Database!"));
        Alt.on("keydown", (key: number) => {
            if (key === 0x4e) this.toggleNoClip(); // Key: N
            if (key === 0x48 && this.noClip === true) this.GetCameraPosition(); // Key: H
            if (key === 0x4f && this.WorldPositions.length > 0 && this.WorldPositions.length <= 10) this.StartCameraMovement(); // Key: O

            if (this.noClip === true) this.noClipUpdate(key);
        });
    }

    private static toggleNoClip() {
        this.noClip = !this.noClip;

        if (this.noClip) {
            Native.setFollowPedCamViewMode(4); // First Person
            Native.setEntityInvincible(this.playerPed, true);
            Native.setEntityVisible(this.playerPed, false, false);
            Native.setEntityCollision(this.playerPed, false, false);
            Native.freezeEntityPosition(this.playerPed, true);
            Native.setEntityAlpha(this.playerPed, 0, false);
            Native.setEntityCoordsNoOffset(this.playerPed, Alt.Player.local.pos.x, Alt.Player.local.pos.y, Alt.Player.local.pos.z, true, true, true);
            Native.setEntityHeading(this.playerPed, Alt.Player.local.rot.z);
        } else {
            Native.setFollowPedCamViewMode(1); // Third Person - Normal Distance
            Native.setEntityInvincible(this.playerPed, false);
            Native.setEntityCollision(this.playerPed, true, true);
            Native.freezeEntityPosition(this.playerPed, false);
            Native.setEntityVisible(this.playerPed, true, false);
            Native.setEntityAlpha(this.playerPed, 255, false);
        }
    }

    private static noClipUpdate(key: number) {
        const camSpeedForward = 10;
        const camSpeed = camSpeedForward / 4;

        if (key === 0x57) {
            // Key: W
            const forwardVector = Native.getEntityForwardVector(this.playerPed);
            Native.setEntityCoordsNoOffset(
                this.playerPed,
                Alt.Player.local.pos.x + forwardVector.x * camSpeedForward,
                Alt.Player.local.pos.y + forwardVector.y * camSpeedForward,
                Alt.Player.local.pos.z + forwardVector.z * camSpeedForward,
                true,
                true,
                true
            );
        }

        if (key === 0x53) {
            // Key: S
            const forwardVector = Native.getEntityForwardVector(this.playerPed);
            Native.setEntityCoordsNoOffset(
                this.playerPed,
                Alt.Player.local.pos.x - forwardVector.x * camSpeed,
                Alt.Player.local.pos.y - forwardVector.y * camSpeed,
                Alt.Player.local.pos.z - forwardVector.z * camSpeed,
                true,
                true,
                true
            );
        }

        if (key === 0x41) {
            // Key: A
            const forwardVector = Native.getEntityForwardVector(this.playerPed);
            Native.setEntityCoordsNoOffset(
                this.playerPed,
                Alt.Player.local.pos.x - forwardVector.y * camSpeed,
                Alt.Player.local.pos.y + forwardVector.x * camSpeed,
                Alt.Player.local.pos.z,
                true,
                true,
                true
            );
        }

        if (key === 0x44) {
            // Key: D
            const forwardVector = Native.getEntityForwardVector(this.playerPed);
            Native.setEntityCoordsNoOffset(
                this.playerPed,
                Alt.Player.local.pos.x + forwardVector.y * camSpeed,
                Alt.Player.local.pos.y - forwardVector.x * camSpeed,
                Alt.Player.local.pos.z,
                true,
                true,
                true
            );
        }

        if (key === 0x45) {
            // Key: E
            Native.setEntityCoordsNoOffset(this.playerPed, Alt.Player.local.pos.x, Alt.Player.local.pos.y, Alt.Player.local.pos.z + 1, true, true, true);
        }

        if (key === 0x51) {
            // Key: Q
            Native.setEntityCoordsNoOffset(this.playerPed, Alt.Player.local.pos.x, Alt.Player.local.pos.y, Alt.Player.local.pos.z - 1, true, true, true);
        }
    }

    private static GetCameraPosition() {
        if (this.WorldPositions.length >= 10) this.WorldPositions.shift();

        const currPlayerPos = { position: Alt.Player.local.pos, rotation: Native.getGameplayCamRot(2) };
        this.WorldPositions.push(currPlayerPos);
        Alt.emitServer("SmoothDirectorCam:SaveCameraPosition", currPlayerPos);
    }
    private static StartCameraMovement() {
        let i = 0;
        let lerpTime = 0;
        let lerpDuration = 1000;
        let currCam = Native.createCam("DEFAULT_SCRIPTED_CAMERA", true);
        Native.setCamMotionBlurStrength(currCam, 1);

        const lerpUpdate = () => {
            if (i < this.WorldPositions.length) {
                const startPos = i > 0 ? this.WorldPositions[i - 1].position : this.WorldPositions[i].position;
                const endPos = this.WorldPositions[i].position;

                const lerpValue = lerpTime / lerpDuration;

                const newX = startPos.x + lerpValue * (endPos.x - startPos.x);
                const newY = startPos.y + lerpValue * (endPos.y - startPos.y);
                const newZ = startPos.z + lerpValue * (endPos.z - startPos.z);
                const newRot = this.WorldPositions[i].rotation;

                Native.setCamCoord(currCam, newX, newY, newZ);
                Native.setCamRot(currCam, newRot.x, newRot.y, newRot.z, 2);
                Native.renderScriptCams(true, true, 200, true, false, 0);

                lerpTime += 100;

                if (lerpTime >= lerpDuration) {
                    i++;
                    lerpTime = 0;
                }
            } else {
                Native.renderScriptCams(false, true, 200, true, false, 0);
                this.WorldPositions = [];
                clearInterval(lerpInterval);
            }
        };

        const lerpInterval = setInterval(lerpUpdate, 100);
    }
}

SmoothDirectorCam.Init();
